import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  MESSAGING_WINDOW_MS,
  segmentFilterSchema,
  type SegmentFilter,
} from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { SegmentQueryService } from "./segment-query.service";

@Injectable()
export class SegmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly segmentQuery: SegmentQueryService,
  ) {}

  list(workspaceId: string) {
    return this.prisma.segment.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
  }

  async get(workspaceId: string, segmentId: string) {
    const segment = await this.prisma.segment.findFirst({
      where: { id: segmentId, workspaceId },
    });
    if (!segment) throw new NotFoundException("Segment not found");
    return segment;
  }

  async create(
    ws: WorkspaceContext,
    actorUserId: string,
    input: { name: string; filter: SegmentFilter },
  ) {
    const segment = await this.prisma.segment.create({
      data: {
        workspaceId: ws.id,
        name: input.name,
        filter: input.filter as Prisma.InputJsonValue,
      },
    });
    this.audit.log({
      organizationId: ws.organizationId,
      workspaceId: ws.id,
      actorUserId,
      action: "segment.created",
      targetType: "Segment",
      targetId: segment.id,
    });
    return segment;
  }

  async update(
    ws: WorkspaceContext,
    actorUserId: string,
    segmentId: string,
    input: { name?: string; filter?: SegmentFilter },
  ) {
    await this.get(ws.id, segmentId);
    const segment = await this.prisma.segment.update({
      where: { id: segmentId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.filter !== undefined
          ? { filter: input.filter as Prisma.InputJsonValue }
          : {}),
      },
    });
    this.audit.log({
      organizationId: ws.organizationId,
      workspaceId: ws.id,
      actorUserId,
      action: "segment.updated",
      targetType: "Segment",
      targetId: segmentId,
    });
    return segment;
  }

  async remove(ws: WorkspaceContext, actorUserId: string, segmentId: string) {
    await this.get(ws.id, segmentId);
    await this.prisma.segment.delete({ where: { id: segmentId } });
    this.audit.log({
      organizationId: ws.organizationId,
      workspaceId: ws.id,
      actorUserId,
      action: "segment.deleted",
      targetType: "Segment",
      targetId: segmentId,
    });
    return { ok: true };
  }

  /**
   * Contact counts for a segment: total matches, and how many are inside the
   * 24h messaging window (i.e. actually sendable right now).
   */
  async preview(
    workspaceId: string,
    segmentId: string,
    igAccountId: string | null,
  ) {
    const segment = await this.get(workspaceId, segmentId);
    const filter = segmentFilterSchema.parse(segment.filter);
    const where = this.segmentQuery.compileFilter(
      workspaceId,
      igAccountId,
      filter,
    );
    const windowStart = new Date(Date.now() - MESSAGING_WINDOW_MS);
    const [total, eligible] = await Promise.all([
      this.prisma.contact.count({ where }),
      this.prisma.contact.count({
        where: { AND: [where, { lastInboundAt: { gte: windowStart } }] },
      }),
    ]);
    return { total, eligible };
  }
}
