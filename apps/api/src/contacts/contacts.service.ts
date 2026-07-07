import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { WorkspaceContext } from "../auth/workspace.guard";

const PAGE_SIZE = 50;
/** Cap on rows scanned when computing the distinct tag list. */
const TAG_SCAN_LIMIT = 2000;
/** Cap on distinct tags returned. */
const TAG_RESULT_LIMIT = 500;

export interface ListContactsQuery {
  search?: string;
  tag?: string;
  cursor?: string;
}

export interface UpdateContactInput {
  tags?: string[];
  optedOut?: boolean;
}

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(workspaceId: string, query: ListContactsQuery) {
    const where: Prisma.ContactWhereInput = { workspaceId };
    if (query.tag) where.tags = { has: query.tag };
    if (query.search) {
      where.OR = [
        { username: { contains: query.search, mode: "insensitive" } },
        { name: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const items = await this.prisma.contact.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: { conversation: { select: { id: true } } },
    });

    const hasMore = items.length > PAGE_SIZE;
    const page = hasMore ? items.slice(0, PAGE_SIZE) : items;
    return {
      items: page,
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
    };
  }

  async get(workspaceId: string, contactId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, workspaceId },
      include: { conversation: { select: { id: true } } },
    });
    if (!contact) throw new NotFoundException("Contact not found");
    return contact;
  }

  async update(
    ws: WorkspaceContext,
    actorUserId: string,
    contactId: string,
    input: UpdateContactInput,
  ) {
    const existing = await this.prisma.contact.findFirst({
      where: { id: contactId, workspaceId: ws.id },
      select: { id: true, optedOutAt: true },
    });
    if (!existing) throw new NotFoundException("Contact not found");

    const data: Prisma.ContactUpdateInput = {};
    if (input.tags !== undefined) data.tags = input.tags;
    if (input.optedOut !== undefined) {
      data.optedOutAt = input.optedOut
        ? (existing.optedOutAt ?? new Date())
        : null;
    }

    const updated = await this.prisma.contact.update({
      where: { id: contactId },
      data,
      include: { conversation: { select: { id: true } } },
    });

    this.audit.log({
      organizationId: ws.organizationId,
      workspaceId: ws.id,
      actorUserId,
      action: "contact.updated",
      targetType: "Contact",
      targetId: contactId,
      meta: {
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        ...(input.optedOut !== undefined ? { optedOut: input.optedOut } : {}),
      },
    });
    return updated;
  }

  async distinctTags(workspaceId: string) {
    const rows = await this.prisma.contact.findMany({
      where: { workspaceId, tags: { isEmpty: false } },
      select: { tags: true },
      orderBy: { updatedAt: "desc" },
      take: TAG_SCAN_LIMIT,
    });
    const tags = new Set<string>();
    for (const row of rows) {
      for (const tag of row.tags) {
        tags.add(tag);
        if (tags.size >= TAG_RESULT_LIMIT) break;
      }
      if (tags.size >= TAG_RESULT_LIMIT) break;
    }
    return { tags: [...tags].sort() };
  }
}
