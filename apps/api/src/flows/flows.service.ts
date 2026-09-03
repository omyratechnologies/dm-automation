import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { flowDefinitionSchema } from "@repo/shared";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { ProblemException } from "../common/problem-details";

const EMPTY_DEFINITION = { nodes: [], edges: [] };
const RUNS_PAGE_SIZE = 20;

/** Loose draft shape — the builder can save work-in-progress graphs. */
export interface DraftDefinitionInput {
  nodes: unknown[];
  edges: unknown[];
}

@Injectable()
export class FlowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(workspaceId: string) {
    const flows = await this.prisma.flow.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
      include: {
        activeVersion: { select: { version: true } },
        versions: {
          where: { publishedAt: null },
          orderBy: { version: "desc" },
          take: 1,
          select: { version: true },
        },
      },
    });
    return flows.map((f) => ({
      id: f.id,
      name: f.name,
      status: f.status,
      version: f.version,
      updatedAt: f.updatedAt,
      activeVersion: f.activeVersion
        ? { version: f.activeVersion.version }
        : null,
      draftVersion: f.versions[0] ? { version: f.versions[0].version } : null,
    }));
  }

  async create(
    workspace: WorkspaceContext,
    user: AuthedRequestUser,
    name: string,
  ) {
    const flow = await this.prisma.flow.create({
      data: {
        workspaceId: workspace.id,
        name,
        versions: { create: { version: 1, definition: EMPTY_DEFINITION } },
      },
    });
    await this.audit.log({
      organizationId: workspace.organizationId,
      workspaceId: workspace.id,
      actorUserId: user.id,
      action: "flow.created",
      targetType: "Flow",
      targetId: flow.id,
    });
    return {
      id: flow.id,
      name: flow.name,
      status: flow.status,
      version: flow.version,
      updatedAt: flow.updatedAt,
    };
  }

  async get(workspaceId: string, id: string) {
    const flow = await this.prisma.flow.findFirst({
      where: { id, workspaceId },
      include: {
        activeVersion: { select: { version: true, definition: true } },
        versions: {
          where: { publishedAt: null },
          orderBy: { version: "desc" },
          take: 1,
          select: { version: true, definition: true },
        },
      },
    });
    if (!flow) throw new NotFoundException("Flow not found");
    return {
      id: flow.id,
      name: flow.name,
      status: flow.status,
      version: flow.version,
      draftDefinition: flow.versions[0]?.definition ?? null,
      activeDefinition: flow.activeVersion?.definition ?? null,
    };
  }

  async update(
    workspaceId: string,
    id: string,
    expectedVersion: number,
    dto: { name?: string; status?: "ACTIVE" | "PAUSED" | "ARCHIVED" },
  ) {
    const flow = await this.findOwned(workspaceId, id);
    if (flow.version !== expectedVersion) throw this.versionConflict();
    if (flow.status === "ARCHIVED") throw new ProblemException(HttpStatus.CONFLICT, "INVALID_AUTOMATION_TRANSITION", "Automation is archived", "Archived automations are immutable");
    if (dto.status === "ACTIVE" && !flow.activeVersionId) {
      throw new BadRequestException(
        "Flow has no published version; publish before activating",
      );
    }
    if (dto.status && !this.allowedTransition(flow.status, dto.status)) throw new ProblemException(HttpStatus.CONFLICT, "INVALID_AUTOMATION_TRANSITION", "Invalid automation transition", `Automation cannot transition from ${flow.status} to ${dto.status}`);
    const claimed = await this.prisma.flow.updateMany({ where: { id: flow.id, workspaceId, version: expectedVersion }, data: { name: dto.name, status: dto.status, version: { increment: 1 } } });
    if (claimed.count !== 1) throw this.versionConflict();
    const updated = await this.findOwned(workspaceId, id);
    return {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      updatedAt: updated.updatedAt,
      version: updated.version,
    };
  }

  async archive(
    workspace: WorkspaceContext,
    user: AuthedRequestUser,
    id: string,
    expectedVersion: number,
  ) {
    const flow = await this.findOwned(workspace.id, id);
    if (flow.version !== expectedVersion) throw this.versionConflict();
    const changed = await this.prisma.flow.updateMany({ where: { id: flow.id, workspaceId: workspace.id, version: expectedVersion, status: { not: "ARCHIVED" } }, data: { status: "ARCHIVED", version: { increment: 1 } } });
    if (changed.count !== 1) throw this.versionConflict();
    await this.audit.log({
      organizationId: workspace.organizationId,
      workspaceId: workspace.id,
      actorUserId: user.id,
      action: "flow.archived",
      targetType: "Flow",
      targetId: flow.id,
      meta: { name: flow.name },
    });
    return { archived: true, version: expectedVersion + 1 };
  }

  /**
   * Save the builder's work-in-progress. Only loosely validated so partial
   * graphs are storable. Updates the newest version in place when it is still
   * unpublished, otherwise starts version+1.
   */
  async saveDraft(
    workspaceId: string,
    id: string,
    expectedVersion: number,
    definition: DraftDefinitionInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.flow.updateMany({ where: { id, workspaceId, version: expectedVersion, status: { not: "ARCHIVED" } }, data: { version: { increment: 1 }, updatedAt: new Date() } });
      if (claimed.count !== 1) throw this.versionConflict();
      const latest = await tx.flowVersion.findFirst({ where: { flowId: id }, orderBy: { version: "desc" } });
      const data = definition as unknown as Prisma.InputJsonValue;
      const saved = latest && !latest.publishedAt
        ? await tx.flowVersion.update({ where: { id: latest.id }, data: { definition: data } })
        : await tx.flowVersion.create({ data: { flowId: id, version: (latest?.version ?? 0) + 1, definition: data } });
      return { draftVersion: saved.version, version: expectedVersion + 1 };
    });
  }

  /**
   * Strictly validate the newest unpublished draft, promote it to the active
   * version, and clone it into a fresh unpublished draft so subsequent edits
   * never mutate the published definition.
   */
  async publish(
    workspace: WorkspaceContext,
    user: AuthedRequestUser,
    id: string,
    expectedVersion: number,
  ) {
    const flow = await this.findOwned(workspace.id, id);
    if (flow.version !== expectedVersion) throw this.versionConflict();
    if (flow.status === "ARCHIVED") throw new ProblemException(HttpStatus.CONFLICT, "INVALID_AUTOMATION_TRANSITION", "Automation is archived", "Archived automations cannot be published");
    const draft = await this.prisma.flowVersion.findFirst({
      where: { flowId: id, publishedAt: null },
      orderBy: { version: "desc" },
    });
    if (!draft) {
      throw new BadRequestException("Flow has no draft version to publish");
    }
    const parsed = flowDefinitionSchema.safeParse(draft.definition);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Flow definition is invalid",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }
    // Store the parsed form so zod defaults (matchType, branch, ...) are baked in.
    const definition = parsed.data as unknown as Prisma.InputJsonValue;
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.flow.updateMany({ where: { id, workspaceId: workspace.id, version: expectedVersion, status: { not: "ARCHIVED" } }, data: { activeVersionId: draft.id, status: "ACTIVE", version: { increment: 1 } } });
      if (claimed.count !== 1) throw this.versionConflict();
      await tx.flowVersion.update({
        where: { id: draft.id },
        data: { definition, publishedAt: new Date() },
      });
      await tx.flowVersion.create({
        data: { flowId: id, version: draft.version + 1, definition },
      });
    });
    await this.audit.log({
      organizationId: workspace.organizationId,
      workspaceId: workspace.id,
      actorUserId: user.id,
      action: "flow.published",
      targetType: "Flow",
      targetId: id,
      meta: { version: draft.version },
    });
    return { publishedVersion: draft.version, status: "ACTIVE" as const, version: expectedVersion + 1 };
  }

  async simulate(workspaceId: string, id: string) {
    await this.findOwned(workspaceId, id);
    const draft = await this.prisma.flowVersion.findFirst({ where: { flowId: id, publishedAt: null }, orderBy: { version: "desc" } });
    if (!draft) throw new ProblemException(HttpStatus.NOT_FOUND, "AUTOMATION_DRAFT_NOT_FOUND", "Draft not found", "The automation has no draft to simulate");
    const parsed = flowDefinitionSchema.safeParse(draft.definition);
    return parsed.success
      ? { valid: true, draftVersion: draft.version, nodeCount: parsed.data.nodes.length, edgeCount: parsed.data.edges.length }
      : { valid: false, draftVersion: draft.version, issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) };
  }

  async runs(workspaceId: string, id: string, cursor?: string) {
    await this.findOwned(workspaceId, id);
    const runs = await this.prisma.flowRun.findMany({
      where: { flowId: id, workspaceId },
      orderBy: { startedAt: "desc" },
      take: RUNS_PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        error: true,
        contact: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePicUrl: true,
          },
        },
      },
    });
    const nextCursor =
      runs.length > RUNS_PAGE_SIZE ? (runs.pop()?.id ?? null) : null;
    return { items: runs, nextCursor };
  }

  async run(workspaceId: string, id: string, runId: string) {
    await this.findOwned(workspaceId, id);
    const run = await this.prisma.flowRun.findFirst({ where: { id: runId, flowId: id, workspaceId }, include: { flowVersion: { select: { id: true, version: true, definition: true } }, contact: { select: { id: true, name: true, username: true } } } });
    if (!run) throw new ProblemException(HttpStatus.NOT_FOUND, "AUTOMATION_RUN_NOT_FOUND", "Run not found", "The automation run does not exist in this workspace");
    return run;
  }

  private async findOwned(workspaceId: string, id: string) {
    const flow = await this.prisma.flow.findFirst({
      where: { id, workspaceId },
    });
    if (!flow) throw new NotFoundException("Flow not found");
    return flow;
  }

  private allowedTransition(from: string, to: string): boolean {
    if (from === to) return true;
    return (from === "ACTIVE" && ["PAUSED", "ARCHIVED"].includes(to))
      || (from === "PAUSED" && ["ACTIVE", "ARCHIVED"].includes(to))
      || (from === "DRAFT" && to === "ARCHIVED");
  }

  private versionConflict(): ProblemException {
    return new ProblemException(HttpStatus.PRECONDITION_FAILED, "VERSION_CONFLICT", "Version conflict", "The automation changed after it was loaded; refresh and retry");
  }
}
