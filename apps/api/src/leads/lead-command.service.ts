import { HttpStatus, Injectable } from "@nestjs/common";
import { ACTOR_TYPE, LEAD_SOURCE, Prisma } from "@prisma/client";
import type { DecisionCommand, LeadCaptureInput } from "@repo/shared";
import { AuditService } from "../audit/audit.service";
import { OutboxService } from "../delivery/outbox.service";
import { PrismaService } from "../prisma/prisma.service";
import { ProblemException } from "../common/problem-details";
import type { AssignLeadDto, BulkLeadCommandDto, CreateTaskDto, MergeLeadDto, TransitionLeadDto, UpdateLeadDto, UpdateTaskDto } from "./dto/leads.dto";

export interface LeadActor {
  actorType: ACTOR_TYPE;
  actorId?: string;
  membershipId?: string;
  correlationId: string;
  causationId?: string;
}

export const SHEET_CANONICAL_FIELDS = new Set([
  "name", "username", "email", "phone", "score", "priority", "notes",
  "stage", "stageId", "lostReason", "owner", "ownerMembershipId", "nextActionAt", "expectedCloseAt",
]);

export function sheetCustomAttributes(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(values).filter(([key]) => !SHEET_CANONICAL_FIELDS.has(key)));
}

@Injectable()
export class LeadCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly audit: AuditService,
  ) {}

  async upsertInstagramContact(input: {
    workspaceId: string;
    igAccountId: string;
    igUserId: string;
    username?: string | null;
    name?: string | null;
    profilePicUrl?: string | null;
    isFollow?: boolean;
    lastInboundAt?: Date;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.igAccount.findFirst({ where: { id: input.igAccountId, workspaceId: input.workspaceId }, select: { id: true } });
      if (!account) throw new ProblemException(HttpStatus.FORBIDDEN, "WORKSPACE_FORBIDDEN", "Workspace mismatch", "The Instagram account does not belong to this workspace");
      const contact = await tx.contact.upsert({
        where: { igAccountId_igUserId: { igAccountId: input.igAccountId, igUserId: input.igUserId } },
        create: {
          workspaceId: input.workspaceId,
          igAccountId: input.igAccountId,
          igUserId: input.igUserId,
          username: input.username,
          name: input.name,
          profilePicUrl: input.profilePicUrl,
          isFollow: input.isFollow ?? false,
          lastInboundAt: input.lastInboundAt,
        },
        update: {
          ...(input.lastInboundAt ? { lastInboundAt: input.lastInboundAt } : {}),
          ...(input.username ? { username: input.username } : {}),
          ...(input.name ? { name: input.name } : {}),
          ...(input.profilePicUrl ? { profilePicUrl: input.profilePicUrl } : {}),
          ...(input.isFollow !== undefined ? { isFollow: input.isFollow } : {}),
        },
      });
      await tx.contactIdentity.upsert({
        where: { workspaceId_type_scopeKey_normalizedValue: { workspaceId: input.workspaceId, type: "INSTAGRAM", scopeKey: input.igAccountId, normalizedValue: input.igUserId } },
        create: { workspaceId: input.workspaceId, contactId: contact.id, type: "INSTAGRAM", scopeKey: input.igAccountId, normalizedValue: input.igUserId, displayValue: input.username ?? input.igUserId, isPrimary: true },
        update: { displayValue: input.username ?? input.igUserId },
      });
      return contact;
    });
  }

  async updateContactTags(workspaceId: string, contactId: string, tags: string[]): Promise<void> {
    const updated = await this.prisma.contact.updateMany({ where: { id: contactId, workspaceId }, data: { tags } });
    if (updated.count !== 1) throw this.notFound();
  }

  async capture(workspaceId: string, input: LeadCaptureInput, actor: LeadActor) {
    const normalizedValue = this.normalizeIdentity(input.identity.type, input.identity.value);
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(async (tx) => {
        const workspace = await tx.workspace.findUnique({
          where: { id: workspaceId },
          select: { id: true, organizationId: true },
        });
        if (!workspace) throw this.notFound();

        let identity = await tx.contactIdentity.findUnique({
          where: {
            workspaceId_type_scopeKey_normalizedValue: {
              workspaceId,
              type: input.identity.type,
              scopeKey: input.identity.scopeKey,
              normalizedValue,
            },
          },
        });
        let contactId = identity?.contactId;
        if (!contactId) {
          const existingInstagramContact = input.identity.type === "INSTAGRAM"
            ? await tx.contact.findUnique({
                where: { igAccountId_igUserId: { igAccountId: input.identity.scopeKey, igUserId: normalizedValue } },
              })
            : null;
          if (existingInstagramContact && existingInstagramContact.workspaceId !== workspaceId) {
            throw new ProblemException(HttpStatus.CONFLICT, "IDENTITY_CONFLICT", "Identity conflict", "The Instagram identity belongs to another workspace");
          }
          const contact = existingInstagramContact ?? await tx.contact.create({
            data: {
              workspaceId,
              name: input.name,
              username: input.username,
              ...(input.identity.type === "INSTAGRAM"
                ? { igAccountId: input.identity.scopeKey, igUserId: normalizedValue }
                : {}),
            },
          });
          contactId = contact.id;
          identity = await tx.contactIdentity.create({
            data: {
              workspaceId,
              contactId,
              type: input.identity.type,
              scopeKey: input.identity.scopeKey,
              normalizedValue,
              displayValue: input.identity.displayValue ?? input.identity.value,
              isPrimary: true,
            },
          });
        }

        const pipeline = input.pipelineId
          ? await tx.leadPipeline.findFirst({ where: { id: input.pipelineId, workspaceId, status: "ACTIVE" } })
          : await tx.leadPipeline.findFirst({ where: { workspaceId, status: "ACTIVE", isDefault: true } });
        if (!pipeline) throw new ProblemException(HttpStatus.CONFLICT, "PIPELINE_NOT_READY", "Pipeline unavailable", "An active pipeline is required before capturing leads");
        const initialStage = await tx.leadStage.findFirst({
          where: { workspaceId, pipelineId: pipeline.id, funnelCategory: "NEW", archivedAt: null },
          orderBy: { position: "asc" },
        });
        if (!initialStage) throw new ProblemException(HttpStatus.CONFLICT, "PIPELINE_NOT_READY", "Pipeline unavailable", "The pipeline requires an active New stage");

        let lead = await tx.lead.findFirst({
          where: { workspaceId, contactId, pipelineId: pipeline.id, recordState: "ACTIVE", outcome: "OPEN" },
        });
        let captured = false;
        if (!lead) {
          lead = await tx.lead.create({
            data: {
              workspaceId,
              contactId,
              pipelineId: pipeline.id,
              stageId: initialStage.id,
              source: input.source as LEAD_SOURCE,
              sourceDetail: input.sourceDetail as Prisma.InputJsonValue | undefined,
            },
          });
          captured = true;
        }

        if (input.consent) {
          await tx.consentRecord.create({
            data: { workspaceId, contactId, ...input.consent },
          });
        }
        await this.applyAttributes(tx, workspaceId, lead.id, input.attributes, actor);
        await tx.leadActivity.create({
          data: {
            workspaceId,
            leadId: lead.id,
            type: captured ? "LEAD_CAPTURED" : "LEAD_CAPTURE_MATCHED",
            actorType: actor.actorType,
            actorId: actor.actorId,
            correlationId: actor.correlationId,
            metadata: { source: input.source, identityId: identity!.id },
          },
        });
        if (captured) {
          await this.outbox.append(tx, {
            type: "LeadCaptured",
            organizationId: workspace.organizationId,
            workspaceId,
            aggregateType: "Lead",
            aggregateId: lead.id,
            aggregateVersion: lead.version,
            actorType: actor.actorType,
            actorId: actor.actorId,
            correlationId: actor.correlationId,
            causationId: actor.causationId,
            payload: { leadId: lead.id, leadVersion: lead.version, source: input.source },
          });
          await this.audit.logInTransaction(tx, {
            organizationId: workspace.organizationId,
            workspaceId,
            actorUserId: actor.actorType === "USER" ? actor.actorId : undefined,
            actorType: actor.actorType === "USER" ? "USER" : "SYSTEM",
            source: actor.actorType,
            correlationId: actor.correlationId,
            action: "lead.captured",
            targetType: "Lead",
            targetId: lead.id,
            meta: { source: input.source },
          });
        }
        return { ...lead, captured };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (["P2002", "P2034"].includes(code ?? "") && attempt < 3) continue;
        if (["P2002", "P2034"].includes(code ?? "")) {
          throw new ProblemException(HttpStatus.CONFLICT, "IDENTITY_CONFLICT", "Identity capture conflict", "The identity was captured concurrently; retry this idempotent command");
        }
        throw error;
      }
    }
    throw new ProblemException(HttpStatus.CONFLICT, "IDENTITY_CONFLICT", "Identity capture conflict", "The identity could not be captured after concurrent updates");
  }

  async ensureLeadForContact(contactId: string, actor: LeadActor, source: LEAD_SOURCE = "AUTOMATION") {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
      include: { identities: { orderBy: { isPrimary: "desc" }, take: 1 } },
    });
    if (!contact) throw this.notFound();
    const identity = contact.identities[0];
    if (!identity) throw new ProblemException(HttpStatus.CONFLICT, "IDENTITY_CONFLICT", "Identity missing", "The contact has no canonical identity");
    return this.capture(contact.workspaceId, {
      identity: { type: identity.type, scopeKey: identity.scopeKey, value: identity.normalizedValue },
      name: contact.name ?? undefined,
      username: contact.username ?? undefined,
      source,
      attributes: {},
    }, actor);
  }

  async update(workspaceId: string, leadId: string, expectedVersion: number, input: UpdateLeadDto, actor: LeadActor) {
    return this.prisma.$transaction(async (tx) => {
      await this.assertOwner(tx, workspaceId, input.ownerMembershipId);
      const result = await tx.lead.updateMany({
        where: { id: leadId, workspaceId, version: expectedVersion, recordState: { not: "MERGED" } },
        data: {
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.score !== undefined ? { score: input.score } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          ...(input.priority !== undefined ? { priority: input.priority } : {}),
          ...(input.ownerMembershipId !== undefined ? { ownerMembershipId: input.ownerMembershipId } : {}),
          ...(input.nextActionAt !== undefined ? { nextActionAt: input.nextActionAt ? new Date(input.nextActionAt) : null } : {}),
          ...(input.expectedCloseAt !== undefined ? { expectedCloseAt: input.expectedCloseAt ? new Date(input.expectedCloseAt) : null } : {}),
          ...(input.status === "QUALIFIED" ? { qualifiedAt: new Date(), disqualifiedAt: null } : {}),
          ...(input.status === "DISQUALIFIED" ? { disqualifiedAt: new Date(), qualifiedAt: null } : {}),
          version: { increment: 1 },
        },
      });
      if (result.count !== 1) await this.throwVersionOrNotFound(tx, workspaceId, leadId);
      const lead = await tx.lead.findUniqueOrThrow({ where: { id_workspaceId: { id: leadId, workspaceId } } });
      const workspace = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { organizationId: true } });
      await this.recordMutation(tx, workspace.organizationId, lead, "LeadUpdated", "lead.updated", actor);
      return lead;
    });
  }

  async transition(workspaceId: string, leadId: string, expectedVersion: number, input: TransitionLeadDto, actor: LeadActor) {
    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({ where: { id_workspaceId: { id: leadId, workspaceId } } });
      if (!lead) throw this.notFound();
      if (lead.version !== expectedVersion) throw this.versionConflict();
      const stage = await tx.leadStage.findFirst({ where: { id: input.stageId, workspaceId, pipelineId: lead.pipelineId, archivedAt: null } });
      if (!stage) throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_LEAD_TRANSITION", "Invalid lead transition", "The destination stage is not active in this lead's pipeline");
      if (stage.lostReasonRequired && !input.lostReason) throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_LEAD_TRANSITION", "Lost reason required", "A lost reason is required for this stage");
      if (lead.outcome !== "OPEN" && !input.reopen) throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_LEAD_TRANSITION", "Explicit reopen required", "Won or lost leads must be explicitly reopened before correction");

      const attributes = await tx.leadAttributeValue.findMany({
        where: { leadId, workspaceId, field: { key: { in: stage.requiredFieldKeys } } },
        select: { field: { select: { key: true } } },
      });
      const present = new Set(attributes.map((value) => value.field.key));
      const missing = stage.requiredFieldKeys.filter((key) => !present.has(key));
      if (missing.length) throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_LEAD_TRANSITION", "Required fields missing", `Complete required fields: ${missing.join(", ")}`);

      const outcome = stage.funnelCategory === "WON" ? "WON" : stage.funnelCategory === "LOST" ? "LOST" : "OPEN";
      const result = await tx.lead.updateMany({
        where: { id: leadId, workspaceId, version: expectedVersion },
        data: {
          stageId: stage.id,
          outcome,
          wonAt: outcome === "WON" ? new Date() : input.reopen ? null : lead.wonAt,
          lostAt: outcome === "LOST" ? new Date() : input.reopen ? null : lead.lostAt,
          disqualifiedAt: outcome === "LOST" ? new Date() : input.reopen ? null : lead.disqualifiedAt,
          sourceDetail: input.lostReason ? { lostReason: input.lostReason } : lead.sourceDetail ?? undefined,
          version: { increment: 1 },
        },
      });
      if (result.count !== 1) throw this.versionConflict();
      const updated = await tx.lead.findUniqueOrThrow({ where: { id_workspaceId: { id: leadId, workspaceId } } });
      const workspace = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { organizationId: true } });
      await this.recordMutation(tx, workspace.organizationId, updated, "LeadStageChanged", "lead.stage_changed", actor, { stageId: stage.id });
      return updated;
    });
  }

  async assign(workspaceId: string, leadId: string, expectedVersion: number, input: AssignLeadDto, actor: LeadActor) {
    await this.assertOwner(this.prisma, workspaceId, input.membershipId);
    return this.update(workspaceId, leadId, expectedVersion, { ownerMembershipId: input.membershipId }, actor);
  }

  async archive(workspaceId: string, leadId: string, expectedVersion: number, archived: boolean, actor: LeadActor) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.lead.updateMany({
        where: { id: leadId, workspaceId, version: expectedVersion, recordState: archived ? "ACTIVE" : "ARCHIVED" },
        data: { recordState: archived ? "ARCHIVED" : "ACTIVE", archivedAt: archived ? new Date() : null, version: { increment: 1 } },
      });
      if (result.count !== 1) await this.throwVersionOrNotFound(tx, workspaceId, leadId);
      const lead = await tx.lead.findUniqueOrThrow({ where: { id_workspaceId: { id: leadId, workspaceId } } });
      const workspace = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { organizationId: true } });
      await this.recordMutation(tx, workspace.organizationId, lead, "LeadUpdated", archived ? "lead.archived" : "lead.restored", actor);
      return lead;
    });
  }

  async createTask(workspaceId: string, leadId: string, input: CreateTaskDto, actor: LeadActor) {
    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({ where: { id_workspaceId: { id: leadId, workspaceId } } });
      if (!lead) throw this.notFound();
      await this.assertOwner(tx, workspaceId, input.assigneeMembershipId);
      const task = await tx.leadTask.create({ data: {
        workspaceId, leadId, title: input.title, description: input.description,
        dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
        assigneeMembershipId: input.assigneeMembershipId,
      } });
      const workspace = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { organizationId: true } });
      await this.outbox.append(tx, {
        type: "TaskCreated", organizationId: workspace.organizationId, workspaceId,
        aggregateType: "LeadTask", aggregateId: task.id, aggregateVersion: task.version,
        actorType: actor.actorType, actorId: actor.actorId, correlationId: actor.correlationId,
        payload: { taskId: task.id, leadId },
      });
      return task;
    });
  }

  async updateTask(workspaceId: string, leadId: string, taskId: string, expectedVersion: number, input: UpdateTaskDto, actor: LeadActor) {
    return this.prisma.$transaction(async (tx) => {
      const changed = await tx.leadTask.updateMany({
        where: { id: taskId, workspaceId, leadId, version: expectedVersion, status: "OPEN" },
        data: { status: input.status, completedAt: input.status === "COMPLETED" ? new Date() : null, version: { increment: 1 } },
      });
      if (changed.count !== 1) throw new ProblemException(HttpStatus.PRECONDITION_FAILED, "VERSION_CONFLICT", "Task version conflict", "The task changed or is no longer open");
      const task = await tx.leadTask.findUniqueOrThrow({ where: { id_workspaceId: { id: taskId, workspaceId } } });
      const workspace = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { organizationId: true } });
      await this.outbox.append(tx, { type: "LeadUpdated", organizationId: workspace.organizationId, workspaceId, aggregateType: "LeadTask", aggregateId: task.id, aggregateVersion: task.version, actorType: actor.actorType, actorId: actor.actorId, correlationId: actor.correlationId, payload: { leadId, leadVersion: task.version, taskId: task.id } });
      return task;
    });
  }

  async merge(workspaceId: string, sourceLeadId: string, expectedVersion: number, input: MergeLeadDto, actor: LeadActor) {
    if (sourceLeadId === input.targetLeadId) throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_LEAD_TRANSITION", "Invalid merge", "A lead cannot be merged into itself");
    return this.prisma.$transaction(async (tx) => {
      const [source, target] = await Promise.all([
        tx.lead.findUnique({ where: { id_workspaceId: { id: sourceLeadId, workspaceId } } }),
        tx.lead.findUnique({ where: { id_workspaceId: { id: input.targetLeadId, workspaceId } } }),
      ]);
      if (!source || !target) throw this.notFound();
      if (source.version !== expectedVersion) throw this.versionConflict();
      if (source.recordState === "MERGED" || target.recordState === "MERGED") throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_LEAD_TRANSITION", "Invalid merge", "Merged leads cannot participate in another merge");
      const changed = await tx.lead.updateMany({ where: { id: source.id, workspaceId, version: expectedVersion }, data: { recordState: "MERGED", canonicalLeadId: target.id, archivedAt: new Date(), version: { increment: 1 } } });
      if (changed.count !== 1) throw this.versionConflict();
      const updated = await tx.lead.findUniqueOrThrow({ where: { id_workspaceId: { id: source.id, workspaceId } } });
      const workspace = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { organizationId: true } });
      await this.recordMutation(tx, workspace.organizationId, updated, "LeadMerged", "lead.merged", actor, { canonicalLeadId: target.id });
      return updated;
    });
  }

  async bulk(workspaceId: string, input: BulkLeadCommandDto, actor: LeadActor) {
    const results = [];
    for (const item of input.leads) {
      if (input.command.type === "ARCHIVE") results.push(await this.archive(workspaceId, item.id, item.version, true, actor));
      else if (input.command.type === "ASSIGN") results.push(await this.assign(workspaceId, item.id, item.version, { membershipId: input.command.membershipId }, actor));
      else results.push(await this.transition(workspaceId, item.id, item.version, { stageId: input.command.stageId, reopen: false }, actor));
    }
    return { items: results };
  }

  async applyAiCommands(workspaceId: string, contactId: string, commands: DecisionCommand[], actor: LeadActor) {
    const ensured = await this.ensureLeadForContact(contactId, actor);
    return this.prisma.$transaction(async (tx) => {
      // Serialize qualification-session creation per lead. The partial unique
      // index remains the database backstop, while this lock prevents a second
      // concurrent AI run from aborting its whole transaction on P2002.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${workspaceId}:${ensured.id}:qualification-session`}, 0))`;
      let leadState = await tx.lead.findUniqueOrThrow({ where: { id_workspaceId: { id: ensured.id, workspaceId } } });
      let leadVersion = leadState.version;
      const workspace = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { organizationId: true, aiPolicyVersion: true } });
      let session = await tx.qualificationSession.findFirst({ where: { workspaceId, leadId: ensured.id, status: { in: ["ACTIVE", "WAITING_INPUT", "PAUSED"] } }, orderBy: { createdAt: "desc" } });
      if (!session) session = await tx.qualificationSession.create({ data: { workspaceId, leadId: ensured.id, policyVersion: workspace.aiPolicyVersion, expiresAt: new Date(Date.now() + 7 * 86_400_000) } });
      const applied: string[] = [];
      let requestedClarification = false;
      for (const command of commands) {
        let appliedValue: Prisma.InputJsonValue | undefined;
        if (command.kind === "SET_FIELD" && command.fieldId && command.confidence >= 0.85) {
          const field = await tx.leadField.findFirst({ where: { id: command.fieldId, workspaceId, archivedAt: null, aiWritable: true } });
          const existing = field ? await tx.leadAttributeValue.findUnique({ where: { leadId_fieldId: { leadId: ensured.id, fieldId: field.id } } }) : null;
          if (field && (!existing || existing.source === "AI" || existing.source === "SYSTEM") && this.validFieldValue(field.type, command.value)) {
            await tx.leadAttributeValue.upsert({
              where: { leadId_fieldId: { leadId: ensured.id, fieldId: field.id } },
              create: { workspaceId, leadId: ensured.id, fieldId: field.id, value: command.value as Prisma.InputJsonValue, source: "AI", confidence: command.confidence, evidenceMessageId: command.evidenceMessageIds[0] },
              update: { value: command.value as Prisma.InputJsonValue, source: "AI", confidence: command.confidence, evidenceMessageId: command.evidenceMessageIds[0], version: { increment: 1 } },
            });
            appliedValue = { fieldId: field.id };
            applied.push(field.id);
          }
        } else if (command.kind === "SET_SCORE" && command.score !== undefined && command.confidence >= 0.9) {
          const latestHumanMutation = await tx.leadActivity.findFirst({ where: { workspaceId, leadId: ensured.id, actorType: "USER", type: "LEAD_UPDATED" }, select: { id: true } });
          if (!latestHumanMutation) {
            const changed = await tx.lead.updateMany({ where: { id: ensured.id, workspaceId, version: leadVersion }, data: { score: command.score, version: { increment: 1 } } });
            if (changed.count === 1) {
              leadState = await tx.lead.findUniqueOrThrow({ where: { id_workspaceId: { id: ensured.id, workspaceId } } });
              leadVersion = leadState.version;
              appliedValue = { score: command.score };
              applied.push("score");
            }
          }
        } else if (command.kind === "ASSIGN_OWNER" && command.membershipId && command.confidence >= 0.9 && !leadState.ownerMembershipId) {
          const member = await tx.membership.findFirst({ where: { id: command.membershipId, workspaceId, status: "ACTIVE" }, select: { id: true } });
          if (member) {
            const changed = await tx.lead.updateMany({ where: { id: ensured.id, workspaceId, version: leadVersion, ownerMembershipId: null }, data: { ownerMembershipId: member.id, version: { increment: 1 } } });
            if (changed.count === 1) {
              leadState = await tx.lead.findUniqueOrThrow({ where: { id_workspaceId: { id: ensured.id, workspaceId } } });
              leadVersion = leadState.version;
              appliedValue = { membershipId: member.id };
              applied.push("owner");
            }
          }
        } else if (command.kind === "MOVE_STAGE" && command.stageId && command.confidence >= 0.9 && leadState.outcome === "OPEN") {
          const stage = await tx.leadStage.findFirst({ where: { id: command.stageId, workspaceId, pipelineId: leadState.pipelineId, archivedAt: null } });
          const terminal = stage?.funnelCategory === "WON" || stage?.funnelCategory === "LOST";
          const terminalEvidenceValid = !terminal || (command.confidence >= 0.95 && command.evidenceMessageIds.length > 0);
          if (stage && terminalEvidenceValid && !stage.lostReasonRequired) {
            const present = await tx.leadAttributeValue.count({ where: { workspaceId, leadId: ensured.id, field: { key: { in: stage.requiredFieldKeys } } } });
            if (present === stage.requiredFieldKeys.length) {
              const outcome = stage.funnelCategory === "WON" ? "WON" : stage.funnelCategory === "LOST" ? "LOST" : "OPEN";
              const changed = await tx.lead.updateMany({ where: { id: ensured.id, workspaceId, version: leadVersion, outcome: "OPEN" }, data: { stageId: stage.id, outcome, wonAt: outcome === "WON" ? new Date() : null, lostAt: outcome === "LOST" ? new Date() : null, version: { increment: 1 } } });
              if (changed.count === 1) {
                leadState = await tx.lead.findUniqueOrThrow({ where: { id_workspaceId: { id: ensured.id, workspaceId } } });
                leadVersion = leadState.version;
                appliedValue = { stageId: stage.id };
                applied.push("stage");
              }
            }
          }
        } else if (command.kind === "ASK_CLARIFICATION") {
          requestedClarification = true;
        }
        await tx.decisionLog.create({ data: {
          workspaceId, leadId: ensured.id,
          type: command.kind === "SET_SCORE" ? "SCORING" : command.kind === "ASSIGN_OWNER" ? "ASSIGNMENT" : command.kind === "MOVE_STAGE" ? "STAGE_TRANSITION" : "QUALIFICATION",
          strategy: command.strategyVersion, model: command.modelVersion, promptVersion: command.promptVersion,
          confidence: command.confidence, evidenceIds: command.evidenceMessageIds,
          proposed: command as unknown as Prisma.InputJsonValue, applied: appliedValue,
          correlationId: actor.correlationId,
        } });
      }
      await tx.qualificationSession.update({ where: { id: session.id }, data: { status: requestedClarification || !applied.length ? "WAITING_INPUT" : "ACTIVE", version: { increment: 1 } } });
      if (applied.length) {
        await this.outbox.append(tx, { type: "LeadUpdated", organizationId: workspace.organizationId, workspaceId, aggregateType: "Lead", aggregateId: ensured.id, aggregateVersion: leadVersion, actorType: "AI", correlationId: actor.correlationId, payload: { leadId: ensured.id, leadVersion } });
      }
      return { leadId: ensured.id, leadVersion, applied };
    });
  }

  async applySheetAttributes(workspaceId: string, leadId: string, expectedVersion: number, destinationId: string, values: Record<string, unknown>, actor: LeadActor) {
    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({ where: { id_workspaceId: { id: leadId, workspaceId } } });
      if (!lead) throw this.notFound();
      if (lead.version !== expectedVersion) throw this.versionConflict();
      const customValues = sheetCustomAttributes(values);
      const fields = await tx.leadField.findMany({ where: { workspaceId, key: { in: Object.keys(customValues) }, archivedAt: null } });
      const conflicts: string[] = [];
      let applied = 0;
      for (const field of fields) {
        const existing = await tx.leadAttributeValue.findUnique({ where: { leadId_fieldId: { leadId, fieldId: field.id } } });
        if (existing && ["HUMAN", "API"].includes(existing.source)) { conflicts.push(field.key); continue; }
        if (!this.validFieldValue(field.type, values[field.key])) { conflicts.push(field.key); continue; }
        await tx.leadAttributeValue.upsert({
          where: { leadId_fieldId: { leadId, fieldId: field.id } },
          create: { workspaceId, leadId, fieldId: field.id, value: values[field.key] as Prisma.InputJsonValue, source: "SHEET" },
          update: { value: values[field.key] as Prisma.InputJsonValue, source: "SHEET", confidence: null, evidenceMessageId: null, version: { increment: 1 } },
        });
        applied += 1;
      }
      const knownCustomFields = new Set(fields.map((field) => field.key));
      conflicts.push(...Object.keys(customValues).filter((key) => !knownCustomFields.has(key)));

      const leadData: Prisma.LeadUpdateInput = {};
      const contactData: Prisma.ContactUpdateInput = {};
      if (typeof values.name === "string" && values.name.trim()) { contactData.name = values.name.trim(); applied += 1; }
      if (typeof values.username === "string" && values.username.trim()) { contactData.username = values.username.trim().replace(/^@/, ""); applied += 1; }
      if (values.score !== undefined) {
        const score = typeof values.score === "number" ? values.score : Number(values.score);
        if (Number.isInteger(score) && score >= 0 && score <= 100) { leadData.score = score; applied += 1; } else conflicts.push("score");
      }
      if (values.priority !== undefined) {
        const priority = String(values.priority).toUpperCase();
        if (["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority)) { leadData.priority = priority as Prisma.EnumLEAD_PRIORITYFieldUpdateOperationsInput["set"]; applied += 1; } else conflicts.push("priority");
      }
      if (values.notes !== undefined) {
        if (typeof values.notes === "string" && values.notes.length <= 1000) { leadData.notes = values.notes; applied += 1; } else conflicts.push("notes");
      }
      for (const key of ["nextActionAt", "expectedCloseAt"] as const) {
        if (values[key] === undefined) continue;
        const parsed = typeof values[key] === "string" ? new Date(values[key]) : null;
        if (parsed && !Number.isNaN(parsed.getTime())) { leadData[key] = parsed; applied += 1; } else conflicts.push(key);
      }

      const stageValue = values.stageId ?? values.stage;
      if (stageValue !== undefined) {
        const stage = await tx.leadStage.findFirst({
          where: {
            workspaceId,
            pipelineId: lead.pipelineId,
            archivedAt: null,
            ...(String(stageValue).match(/^[0-9a-f-]{36}$/i)
              ? { id: String(stageValue) }
              : { name: { equals: String(stageValue), mode: "insensitive" } }),
          },
        });
        if (!stage || (stage.lostReasonRequired && typeof values.lostReason !== "string")) {
          conflicts.push(values.stageId !== undefined ? "stageId" : "stage");
        } else {
          const requiredValues = await tx.leadAttributeValue.count({ where: { workspaceId, leadId, field: { key: { in: stage.requiredFieldKeys } } } });
          if (requiredValues !== stage.requiredFieldKeys.length) {
            conflicts.push(values.stageId !== undefined ? "stageId" : "stage");
          } else {
            const outcome = stage.funnelCategory === "WON" ? "WON" : stage.funnelCategory === "LOST" ? "LOST" : "OPEN";
            leadData.stage = { connect: { id_pipelineId_workspaceId: { id: stage.id, pipelineId: lead.pipelineId, workspaceId } } };
            leadData.outcome = outcome;
            leadData.wonAt = outcome === "WON" ? new Date() : null;
            leadData.lostAt = outcome === "LOST" ? new Date() : null;
            applied += 1;
          }
        }
      }

      const ownerValue = values.ownerMembershipId ?? values.owner;
      if (ownerValue !== undefined) {
        const text = String(ownerValue).trim();
        const owner = text ? await tx.membership.findFirst({
          where: {
            workspaceId,
            status: "ACTIVE",
            ...(text.match(/^[0-9a-f-]{36}$/i)
              ? { id: text }
              : { user: { email: { equals: text, mode: "insensitive" } } }),
          },
        }) : null;
        if (!owner) conflicts.push(values.ownerMembershipId !== undefined ? "ownerMembershipId" : "owner");
        else { leadData.owner = { connect: { id_workspaceId: { id: owner.id, workspaceId } } }; applied += 1; }
      }

      for (const [key, type] of [["email", "EMAIL"], ["phone", "PHONE"]] as const) {
        if (values[key] === undefined) continue;
        const displayValue = String(values[key]).trim();
        const normalizedValue = this.normalizeIdentity(type, displayValue);
        const valid = type === "EMAIL" ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue) : normalizedValue.length >= 7;
        if (!valid) { conflicts.push(key); continue; }
        const existing = await tx.contactIdentity.findUnique({ where: { workspaceId_type_scopeKey_normalizedValue: { workspaceId, type, scopeKey: "", normalizedValue } } });
        if (existing && existing.contactId !== lead.contactId) { conflicts.push(key); continue; }
        await tx.contactIdentity.upsert({
          where: { workspaceId_type_scopeKey_normalizedValue: { workspaceId, type, scopeKey: "", normalizedValue } },
          create: { workspaceId, contactId: lead.contactId, type, scopeKey: "", normalizedValue, displayValue },
          update: { displayValue },
        });
        applied += 1;
      }

      if (Object.keys(contactData).length) await tx.contact.update({ where: { id_workspaceId: { id: lead.contactId, workspaceId } }, data: contactData });
      const updated = applied ? await tx.lead.update({ where: { id_workspaceId: { id: lead.id, workspaceId } }, data: { ...leadData, version: { increment: 1 } } }) : lead;
      for (const fieldKey of conflicts) {
        await tx.sheetSyncConflict.create({ data: { workspaceId, destinationId, leadId, fieldKey, appVersion: lead.version, sheetVersion: expectedVersion, sheetValue: values[fieldKey] as Prisma.InputJsonValue } });
      }
      if (applied) {
        const workspace = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { organizationId: true } });
        await this.outbox.append(tx, { type: "SheetInboundApplied", organizationId: workspace.organizationId, workspaceId, aggregateType: "Lead", aggregateId: leadId, aggregateVersion: updated.version, actorType: "GOOGLE_SHEET", correlationId: actor.correlationId, causationId: actor.causationId, payload: { leadId, leadVersion: updated.version, destinationId } });
      }
      return { lead: updated, applied, conflicts };
    });
  }

  private async recordMutation(
    tx: Prisma.TransactionClient,
    organizationId: string,
    lead: { id: string; workspaceId: string; version: number },
    eventType: string,
    action: string,
    actor: LeadActor,
    payload: Prisma.InputJsonObject = {},
  ): Promise<void> {
    await tx.leadActivity.create({ data: { workspaceId: lead.workspaceId, leadId: lead.id, type: action.toUpperCase().replaceAll(".", "_"), actorType: actor.actorType, actorId: actor.actorId, correlationId: actor.correlationId, metadata: payload } });
    await this.outbox.append(tx, { type: eventType, organizationId, workspaceId: lead.workspaceId, aggregateType: "Lead", aggregateId: lead.id, aggregateVersion: lead.version, actorType: actor.actorType, actorId: actor.actorId, correlationId: actor.correlationId, causationId: actor.causationId, payload: { leadId: lead.id, leadVersion: lead.version, ...payload } });
    await this.audit.logInTransaction(tx, { organizationId, workspaceId: lead.workspaceId, actorUserId: actor.actorType === "USER" ? actor.actorId : undefined, actorType: actor.actorType === "USER" ? "USER" : "SYSTEM", source: actor.actorType, correlationId: actor.correlationId, action, targetType: "Lead", targetId: lead.id, meta: { version: lead.version } });
  }

  private async applyAttributes(tx: Prisma.TransactionClient, workspaceId: string, leadId: string, values: Record<string, unknown>, actor: LeadActor): Promise<void> {
    if (!Object.keys(values).length) return;
    const fields = await tx.leadField.findMany({ where: { workspaceId, key: { in: Object.keys(values) }, archivedAt: null } });
    if (fields.length !== Object.keys(values).length) throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "UNKNOWN_LEAD_FIELD", "Unknown lead field", "One or more lead attributes are not configured in this workspace");
    for (const field of fields) {
      await tx.leadAttributeValue.upsert({
        where: { leadId_fieldId: { leadId, fieldId: field.id } },
        create: { workspaceId, leadId, fieldId: field.id, value: values[field.key] as Prisma.InputJsonValue, source: actor.actorType === "AI" ? "AI" : actor.actorType === "GOOGLE_SHEET" ? "SHEET" : "HUMAN", updatedByMembershipId: actor.membershipId },
        update: { value: values[field.key] as Prisma.InputJsonValue, source: actor.actorType === "AI" ? "AI" : actor.actorType === "GOOGLE_SHEET" ? "SHEET" : "HUMAN", updatedByMembershipId: actor.membershipId, version: { increment: 1 } },
      });
    }
  }

  private async assertOwner(client: Pick<PrismaService, "membership"> | Prisma.TransactionClient, workspaceId: string, membershipId?: string | null): Promise<void> {
    if (!membershipId) return;
    const member = await client.membership.findUnique({ where: { id_workspaceId: { id: membershipId, workspaceId } }, select: { id: true } });
    if (!member) throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "WORKSPACE_FORBIDDEN", "Invalid owner", "The selected owner is not a member of this workspace");
  }

  private async throwVersionOrNotFound(tx: Prisma.TransactionClient, workspaceId: string, leadId: string): Promise<never> {
    const exists = await tx.lead.count({ where: { id: leadId, workspaceId } });
    if (!exists) throw this.notFound();
    throw this.versionConflict();
  }

  private normalizeIdentity(type: LeadCaptureInput["identity"]["type"], value: string): string {
    const normalized = value.trim();
    if (type === "EMAIL") return normalized.toLowerCase();
    if (type === "PHONE") return normalized.replace(/[^\d+]/g, "");
    return normalized;
  }

  private validFieldValue(type: string, value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (["NUMBER", "CURRENCY"].includes(type)) return typeof value === "number" && Number.isFinite(value);
    if (type === "BOOLEAN") return typeof value === "boolean";
    if (type === "MULTI_SELECT") return Array.isArray(value) && value.every((item) => typeof item === "string");
    if (["DATE", "DATETIME"].includes(type)) return typeof value === "string" && !Number.isNaN(Date.parse(value));
    if (type === "EMAIL") return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return typeof value === "string" && value.length <= 5000;
  }

  private notFound(): ProblemException {
    return new ProblemException(HttpStatus.NOT_FOUND, "LEAD_NOT_FOUND", "Lead not found", "The lead does not exist in this workspace");
  }

  private versionConflict(): ProblemException {
    return new ProblemException(HttpStatus.PRECONDITION_FAILED, "VERSION_CONFLICT", "Version conflict", "The lead changed after it was loaded; refresh and retry");
  }
}
