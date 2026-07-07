import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { flowDefinitionSchema } from "@repo/shared";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";

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
    this.audit.log({
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
      draftDefinition: flow.versions[0]?.definition ?? null,
      activeDefinition: flow.activeVersion?.definition ?? null,
    };
  }

  async update(
    workspaceId: string,
    id: string,
    dto: { name?: string; status?: "ACTIVE" | "PAUSED" },
  ) {
    const flow = await this.findOwned(workspaceId, id);
    if (dto.status === "ACTIVE" && !flow.activeVersionId) {
      throw new BadRequestException(
        "Flow has no published version; publish before activating",
      );
    }
    const updated = await this.prisma.flow.update({
      where: { id: flow.id },
      data: { name: dto.name, status: dto.status },
    });
    return {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      updatedAt: updated.updatedAt,
    };
  }

  async remove(
    workspace: WorkspaceContext,
    user: AuthedRequestUser,
    id: string,
  ) {
    const flow = await this.findOwned(workspace.id, id);
    await this.prisma.flow.delete({ where: { id: flow.id } });
    this.audit.log({
      organizationId: workspace.organizationId,
      workspaceId: workspace.id,
      actorUserId: user.id,
      action: "flow.deleted",
      targetType: "Flow",
      targetId: flow.id,
      meta: { name: flow.name },
    });
    return { deleted: true };
  }

  /**
   * Save the builder's work-in-progress. Only loosely validated so partial
   * graphs are storable. Updates the newest version in place when it is still
   * unpublished, otherwise starts version+1.
   */
  async saveDraft(
    workspaceId: string,
    id: string,
    definition: DraftDefinitionInput,
  ) {
    await this.findOwned(workspaceId, id);
    const latest = await this.prisma.flowVersion.findFirst({
      where: { flowId: id },
      orderBy: { version: "desc" },
    });
    const data = definition as unknown as Prisma.InputJsonValue;
    const saved =
      latest && !latest.publishedAt
        ? await this.prisma.flowVersion.update({
            where: { id: latest.id },
            data: { definition: data },
          })
        : await this.prisma.flowVersion.create({
            data: {
              flowId: id,
              version: (latest?.version ?? 0) + 1,
              definition: data,
            },
          });
    // Touch the flow so list ordering reflects builder activity.
    await this.prisma.flow.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
    return { version: saved.version };
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
  ) {
    await this.findOwned(workspace.id, id);
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
    await this.prisma.$transaction([
      this.prisma.flowVersion.update({
        where: { id: draft.id },
        data: { definition, publishedAt: new Date() },
      }),
      this.prisma.flow.update({
        where: { id },
        data: { activeVersionId: draft.id, status: "ACTIVE" },
      }),
      this.prisma.flowVersion.create({
        data: { flowId: id, version: draft.version + 1, definition },
      }),
    ]);
    this.audit.log({
      organizationId: workspace.organizationId,
      workspaceId: workspace.id,
      actorUserId: user.id,
      action: "flow.published",
      targetType: "Flow",
      targetId: id,
      meta: { version: draft.version },
    });
    return { publishedVersion: draft.version, status: "ACTIVE" as const };
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

  private async findOwned(workspaceId: string, id: string) {
    const flow = await this.prisma.flow.findFirst({
      where: { id, workspaceId },
    });
    if (!flow) throw new NotFoundException("Flow not found");
    return flow;
  }
}
