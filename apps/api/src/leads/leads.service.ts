import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLeadFieldDto, UpdateLeadDto, UpdateLeadFieldValueDto } from "./dto/leads.dto";
import type { LEAD_STATUS } from "@prisma/client";

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Seed standard lead fields for a workspace if they don't exist */
  async seedDefaultFields(workspaceId: string): Promise<void> {
    const defaults = [
      { key: "email", label: "Email Address", type: "TEXT" as const },
      { key: "phone", label: "Phone Number", type: "TEXT" as const },
      { key: "budget", label: "Estimated Budget", type: "NUMBER" as const },
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
      },
    });
  }

  /** List workspace leads optionally filtered by status */
  async listLeads(workspaceId: string, status?: LEAD_STATUS) {
    return this.prisma.lead.findMany({
      where: {
        contact: { workspaceId },
        ...(status ? { status } : {}),
      },
      include: {
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
      orderBy: { createdAt: "desc" },
    });
  }

  /** Find or initialize a lead object for a contact */
  async findOrCreateLeadForContact(contactId: string) {
    return this.prisma.lead.upsert({
      where: { contactId },
      create: { contactId, status: "NEW" },
      update: {},
    });
  }

  /** Update lead status or scoring details */
  async updateLead(leadId: string, workspaceId: string, dto: UpdateLeadDto) {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id: leadId,
        contact: { workspaceId },
      },
    });

    if (!lead) {
      throw new NotFoundException("Lead not found");
    }

    const now = new Date();
    const qualifiedAt =
      dto.status === "QUALIFIED"
        ? now
        : dto.status !== undefined
        ? null
        : lead.qualifiedAt;
    const disqualifiedAt =
      dto.status === "DISQUALIFIED"
        ? now
        : dto.status !== undefined
        ? null
        : lead.disqualifiedAt;

    return this.prisma.lead.update({
      where: { id: leadId },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.score !== undefined ? { score: dto.score } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        qualifiedAt,
        disqualifiedAt,
      },
      include: {
        contact: true,
      },
    });
  }

  /** Save custom field values captured from DMs or CRM dashboard */
  async saveLeadFieldValue(contactId: string, workspaceId: string, dto: UpdateLeadFieldValueDto) {
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
