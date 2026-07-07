import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import {
  QUEUES,
  segmentFilterSchema,
  type BroadcastJob,
} from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { SegmentQueryService } from "../segments/segment-query.service";

export interface CreateBroadcastInput {
  name: string;
  igAccountId: string;
  segmentId?: string | null;
  messageText: string;
}

export interface UpdateBroadcastInput {
  name?: string;
  igAccountId?: string;
  segmentId?: string | null;
  messageText?: string;
}

@Injectable()
export class BroadcastsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly segmentQuery: SegmentQueryService,
    @InjectQueue(QUEUES.BROADCASTS)
    private readonly broadcastsQueue: Queue<BroadcastJob>,
  ) {}

  list(workspaceId: string) {
    return this.prisma.broadcast.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      include: { segment: { select: { id: true, name: true } } },
    });
  }

  async get(workspaceId: string, broadcastId: string) {
    const broadcast = await this.prisma.broadcast.findFirst({
      where: { id: broadcastId, workspaceId },
      include: { segment: { select: { id: true, name: true } } },
    });
    if (!broadcast) throw new NotFoundException("Broadcast not found");
    return broadcast;
  }

  async create(
    ws: WorkspaceContext,
    actorUserId: string,
    input: CreateBroadcastInput,
  ) {
    await this.assertIgAccount(ws.id, input.igAccountId);
    if (input.segmentId) await this.assertSegment(ws.id, input.segmentId);

    const broadcast = await this.prisma.broadcast.create({
      data: {
        workspaceId: ws.id,
        igAccountId: input.igAccountId,
        segmentId: input.segmentId ?? null,
        name: input.name,
        messageText: input.messageText,
        status: "DRAFT",
        createdById: actorUserId,
      },
    });
    this.audit.log({
      organizationId: ws.organizationId,
      workspaceId: ws.id,
      actorUserId,
      action: "broadcast.created",
      targetType: "Broadcast",
      targetId: broadcast.id,
    });
    return broadcast;
  }

  async update(
    ws: WorkspaceContext,
    actorUserId: string,
    broadcastId: string,
    input: UpdateBroadcastInput,
  ) {
    const broadcast = await this.get(ws.id, broadcastId);
    if (broadcast.status !== "DRAFT") {
      throw new ConflictException("Only DRAFT broadcasts can be edited");
    }
    if (input.igAccountId) await this.assertIgAccount(ws.id, input.igAccountId);
    if (input.segmentId) await this.assertSegment(ws.id, input.segmentId);

    const updated = await this.prisma.broadcast.update({
      where: { id: broadcastId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.igAccountId !== undefined
          ? { igAccountId: input.igAccountId }
          : {}),
        ...(input.segmentId !== undefined
          ? { segmentId: input.segmentId }
          : {}),
        ...(input.messageText !== undefined
          ? { messageText: input.messageText }
          : {}),
      },
    });
    this.audit.log({
      organizationId: ws.organizationId,
      workspaceId: ws.id,
      actorUserId,
      action: "broadcast.updated",
      targetType: "Broadcast",
      targetId: broadcastId,
    });
    return updated;
  }

  /** Compute targets, mark QUEUED, and enqueue the fan-out job. */
  async send(ws: WorkspaceContext, actorUserId: string, broadcastId: string) {
    const broadcast = await this.prisma.broadcast.findFirst({
      where: { id: broadcastId, workspaceId: ws.id },
      include: { segment: true },
    });
    if (!broadcast) throw new NotFoundException("Broadcast not found");
    if (broadcast.status !== "DRAFT") {
      throw new ConflictException("Only DRAFT broadcasts can be sent");
    }

    // null segment → every non-opted-out contact of the IG account.
    const filter = broadcast.segment
      ? segmentFilterSchema.parse(broadcast.segment.filter)
      : { conditions: [] };
    const where = this.segmentQuery.compileFilter(
      ws.id,
      broadcast.igAccountId,
      filter,
    );
    const totalTargets = await this.prisma.contact.count({ where });

    // Guard on DRAFT so a concurrent double-send only transitions once.
    const { count } = await this.prisma.broadcast.updateMany({
      where: { id: broadcastId, status: "DRAFT" },
      data: { status: "QUEUED", totalTargets },
    });
    if (count === 0) {
      throw new ConflictException("Broadcast is no longer in DRAFT");
    }

    await this.broadcastsQueue.add(
      "fan-out",
      { broadcastId },
      { jobId: broadcastId },
    );

    this.audit.log({
      organizationId: ws.organizationId,
      workspaceId: ws.id,
      actorUserId,
      action: "broadcast.sent",
      targetType: "Broadcast",
      targetId: broadcastId,
      meta: { totalTargets },
    });
    return this.get(ws.id, broadcastId);
  }

  async cancel(ws: WorkspaceContext, actorUserId: string, broadcastId: string) {
    await this.get(ws.id, broadcastId);
    const { count } = await this.prisma.broadcast.updateMany({
      where: {
        id: broadcastId,
        workspaceId: ws.id,
        status: { in: ["QUEUED", "SENDING"] },
      },
      data: { status: "CANCELED" },
    });
    if (count === 0) {
      throw new ConflictException(
        "Only QUEUED or SENDING broadcasts can be canceled",
      );
    }
    this.audit.log({
      organizationId: ws.organizationId,
      workspaceId: ws.id,
      actorUserId,
      action: "broadcast.canceled",
      targetType: "Broadcast",
      targetId: broadcastId,
    });
    return this.get(ws.id, broadcastId);
  }

  private async assertIgAccount(workspaceId: string, igAccountId: string) {
    const account = await this.prisma.igAccount.findFirst({
      where: { id: igAccountId, workspaceId },
      select: { id: true },
    });
    if (!account) {
      throw new BadRequestException("IG account not found in this workspace");
    }
  }

  private async assertSegment(workspaceId: string, segmentId: string) {
    const segment = await this.prisma.segment.findFirst({
      where: { id: segmentId, workspaceId },
      select: { id: true },
    });
    if (!segment) {
      throw new BadRequestException("Segment not found in this workspace");
    }
  }
}
