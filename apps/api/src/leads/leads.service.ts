import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLeadFieldDto, CreatePipelineDto, CreateSavedViewDto, CreateStageDto, UpdateLeadDto, UpdateLeadFieldValueDto } from "./dto/leads.dto";
import { Prisma, type LEAD_STATUS } from "@prisma/client";
import { LeadCommandService } from "./lead-command.service";

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commands: LeadCommandService,
  ) {}

  /** Seed standard lead fields for a workspace if they don't exist */
  async seedDefaultFields(workspaceId: string): Promise<void> {
    const defaults = [
      { key: "email", label: "Email Address", type: "EMAIL" as const, aiWritable: true, classification: "CONFIDENTIAL" as const },
      { key: "phone", label: "Phone Number", type: "PHONE" as const, aiWritable: true, classification: "CONFIDENTIAL" as const },
      { key: "budget", label: "Estimated Budget", type: "NUMBER" as const, aiWritable: true, classification: "CONFIDENTIAL" as const },
    ];

    for (const d of defaults) {
      await this.prisma.leadField.upsert({
        where: {
          workspaceId_key: {
            workspaceId,
            key: d.key,
          },
        },
        create: {
          workspaceId,
          key: d.key,
          label: d.label,
          type: d.type,
          aiWritable: d.aiWritable,
          classification: d.classification,
        },
        update: {},
      });
    }
  }

  /** List custom fields definition for workspace */
  async listLeadFields(workspaceId: string) {
    // Seed defaults dynamically on retrieval to ensure consistent workspace setups
    await this.seedDefaultFields(workspaceId);

    return this.prisma.leadField.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    });
  }

  /** Define a new custom lead field */
  async createLeadField(workspaceId: string, dto: CreateLeadFieldDto) {
    const exists = await this.prisma.leadField.findUnique({
      where: {
        workspaceId_key: {
          workspaceId,
          key: dto.key,
        },
      },
    });

    if (exists) {
      throw new ConflictException(`Lead field with key "${dto.key}" already exists`);
    }

    return this.prisma.leadField.create({
      data: {
        workspaceId,
        key: dto.key,
        label: dto.label,
        type: dto.type,
        required: dto.required ?? false,
        classification: dto.classification ?? "INTERNAL",
        sheetExportPolicy: dto.sheetExportPolicy ?? "DENY",
        aiWritable: dto.aiWritable ?? false,
      },
    });
  }

  /** List workspace leads optionally filtered by status */
  async listLeads(workspaceId: string, query: { status?: LEAD_STATUS; cursor?: string; limit?: number; search?: string; pipelineId?: string; needsAttention?: boolean } = {}) {
    const { status, cursor, search, pipelineId, needsAttention } = query;
    const take = Math.min(Math.max(query.limit ?? 50, 1), 100);
    const where: Prisma.LeadWhereInput = {
      workspaceId,
      ...(status ? { status } : {}),
      ...(pipelineId ? { pipelineId } : {}),
      ...(search ? { contact: { OR: [{ name: { contains: search, mode: "insensitive" } }, { username: { contains: search, mode: "insensitive" } }, { identities: { some: { displayValue: { contains: search, mode: "insensitive" } } } }] } } : {}),
      ...(needsAttention ? { OR: [{ ownerMembershipId: null }, { nextActionAt: { lt: new Date() } }] } : {}),
    };
    const items = await this.prisma.lead.findMany({
      where,
      include: {
        pipeline: true,
        stage: true,
        owner: { include: { user: { select: { id: true, firstname: true, lastname: true, email: true } } } },
        contact: {
          include: {
            fieldValues: {
              include: {
                field: true,
              },
            },
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = items.length > take;
    const page = hasMore ? items.slice(0, take) : items;
    return { items: page.map((lead) => ({ ...lead, expectedValueMinor: lead.expectedValueMinor?.toString() ?? null })), nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null };
  }

  async getLead(workspaceId: string, leadId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id_workspaceId: { id: leadId, workspaceId } },
      include: {
        contact: { include: { identities: true, conversation: { select: { id: true } } } },
        pipeline: true,
        stage: true,
        owner: { include: { user: { select: { id: true, firstname: true, lastname: true, email: true } } } },
        attributes: { include: { field: true } },
        tasks: { orderBy: { createdAt: "desc" }, take: 100 },
        activities: { orderBy: { createdAt: "desc" }, take: 100 },
        meetings: { orderBy: { startsAt: "desc" }, take: 50 },
        sheetRows: true,
      },
    });
    if (!lead) throw new NotFoundException("Lead not found");
    return lead;
  }

  listPipelines(workspaceId: string) {
    return this.prisma.leadPipeline.findMany({
      where: { workspaceId, status: { not: "ARCHIVED" } },
      include: { stages: { where: { archivedAt: null }, orderBy: { position: "asc" } } },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
  }

  async createPipeline(workspaceId: string, input: CreatePipelineDto) {
    return this.prisma.$transaction(async (tx) => {
      if (input.isDefault) await tx.leadPipeline.updateMany({ where: { workspaceId, isDefault: true }, data: { isDefault: false } });
      return tx.leadPipeline.create({ data: { workspaceId, name: input.name, description: input.description, isDefault: input.isDefault } });
    });
  }

  async createStage(workspaceId: string, pipelineId: string, input: CreateStageDto) {
    const pipeline = await this.prisma.leadPipeline.findUnique({ where: { id_workspaceId: { id: pipelineId, workspaceId } } });
    if (!pipeline || pipeline.status !== "DRAFT") throw new ConflictException("Stages can only be added to a draft pipeline");
    return this.prisma.leadStage.create({ data: { workspaceId, pipelineId, ...input } });
  }

  async setPipelineStatus(workspaceId: string, pipelineId: string, expectedVersion: number, status: "ACTIVE" | "ARCHIVED") {
    return this.prisma.$transaction(async (tx) => {
      const pipeline = await tx.leadPipeline.findUnique({ where: { id_workspaceId: { id: pipelineId, workspaceId } }, include: { stages: { where: { archivedAt: null } } } });
      if (!pipeline) throw new NotFoundException("Pipeline not found");
      if (pipeline.version !== expectedVersion) throw new ConflictException("Pipeline version conflict");
      if (status === "ACTIVE") {
        const won = pipeline.stages.filter((stage) => stage.funnelCategory === "WON").length;
        const lost = pipeline.stages.filter((stage) => stage.funnelCategory === "LOST").length;
        const open = pipeline.stages.some((stage) => !["WON", "LOST"].includes(stage.funnelCategory));
        if (!open || won !== 1 || lost !== 1) throw new ConflictException("An active pipeline requires open stages and exactly one Won and Lost stage");
      }
      const changed = await tx.leadPipeline.updateMany({ where: { id: pipelineId, workspaceId, version: expectedVersion, ...(status === "ACTIVE" ? { status: "DRAFT" } : { status: { not: "ARCHIVED" } }) }, data: { status, version: { increment: 1 } } });
      if (changed.count !== 1) throw new ConflictException("Pipeline transition is not allowed");
      return tx.leadPipeline.findUniqueOrThrow({ where: { id_workspaceId: { id: pipelineId, workspaceId } } });
    });
  }

  listSavedViews(workspaceId: string, userId: string) {
    return this.prisma.leadSavedView.findMany({ where: { workspaceId, OR: [{ ownerUserId: userId }, { isShared: true }] }, orderBy: [{ isShared: "desc" }, { name: "asc" }] });
  }

  createSavedView(workspaceId: string, userId: string, input: CreateSavedViewDto) {
    return this.prisma.leadSavedView.create({ data: { workspaceId, ownerUserId: userId, name: input.name, isShared: input.isShared, filters: input.filters as Prisma.InputJsonValue, sort: input.sort as Prisma.InputJsonValue | undefined, columns: input.columns as Prisma.InputJsonValue | undefined } });
  }

  async deleteSavedView(workspaceId: string, userId: string, viewId: string): Promise<{ deleted: true }> {
    const deleted = await this.prisma.leadSavedView.deleteMany({ where: { id: viewId, workspaceId, ownerUserId: userId } });
    if (deleted.count !== 1) throw new NotFoundException("Saved view not found");
    return { deleted: true };
  }

  /** Find or initialize a lead object for a contact */
  async findOrCreateLeadForContact(contactId: string) {
    return this.commands.ensureLeadForContact(contactId, {
      actorType: "SYSTEM",
      correlationId: randomUUID(),
    });
  }

  /** Update lead status or scoring details */
  async updateLead(leadId: string, workspaceId: string, dto: UpdateLeadDto) {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id: leadId,
        workspaceId,
      },
    });

    if (!lead) {
      throw new NotFoundException("Lead not found");
    }

    return this.commands.update(workspaceId, leadId, lead.version, dto, {
      actorType: "SYSTEM",
      correlationId: randomUUID(),
    });
  }

  /** Save custom field values captured from DMs or CRM dashboard */
  async saveLeadFieldValue(contactId: string, workspaceId: string, dto: UpdateLeadFieldValueDto) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, workspaceId },
      select: { id: true },
    });
    if (!contact) throw new NotFoundException("Contact not found in this workspace");
    // Validate field belongs to the workspace
    const field = await this.prisma.leadField.findFirst({
      where: {
        id: dto.fieldId,
        workspaceId,
      },
    });

    if (!field) {
      throw new NotFoundException("Lead field definition not found in this workspace");
    }

    // Auto-create/touch the lead relationship
    await this.findOrCreateLeadForContact(contactId);

    return this.prisma.leadFieldValue.upsert({
      where: {
        contactId_fieldId: {
          contactId,
          fieldId: dto.fieldId,
        },
      },
      create: {
        contactId,
        fieldId: dto.fieldId,
        value: dto.value,
      },
      update: {
        value: dto.value,
      },
    });
  }
}
