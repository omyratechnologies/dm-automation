import { Logger } from "@nestjs/common";
import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job, Queue } from "bullmq";
import {
  MESSAGING_WINDOW_MS,
  QUEUES,
  segmentFilterSchema,
  type BroadcastJob,
  type SendMessageJob,
} from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { SegmentQueryService } from "../segments/segment-query.service";

const BATCH_SIZE = 200;

/**
 * Fans a QUEUED broadcast out into individual SendMessageJobs. Contacts
 * outside the 24h messaging window are counted as skipped. The send
 * processor (owned elsewhere) updates sent/failed counters afterwards.
 */
@Processor(QUEUES.BROADCASTS, { concurrency: 2 })
export class BroadcastsProcessor extends WorkerHost {
  private readonly logger = new Logger(BroadcastsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly segmentQuery: SegmentQueryService,
    @InjectQueue(QUEUES.SEND_MESSAGES)
    private readonly sendQueue: Queue<SendMessageJob>,
  ) {
    super();
  }

  async process(job: Job<BroadcastJob>): Promise<void> {
    try {
      await this.fanOut(job.data.broadcastId);
    } catch (err) {
      this.logger.error(
        `broadcast ${job.data.broadcastId} fan-out failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }

  async fanOut(broadcastId: string): Promise<void> {
    const broadcast = await this.prisma.broadcast.findUnique({
      where: { id: broadcastId },
      include: { segment: true },
    });
    if (!broadcast || broadcast.status !== "QUEUED") {
      // Canceled, already fanned out, or deleted — nothing to do (idempotent).
      this.logger.log(
        `broadcast ${broadcastId} not in QUEUED state, skipping fan-out`,
      );
      return;
    }

    await this.prisma.broadcast.update({
      where: { id: broadcastId },
      data: { status: "SENDING" },
    });

    const filter = broadcast.segment
      ? segmentFilterSchema.parse(broadcast.segment.filter)
      : { conditions: [] };
    const where = this.segmentQuery.compileFilter(
      broadcast.workspaceId,
      broadcast.igAccountId,
      filter,
    );
    const windowStart = Date.now() - MESSAGING_WINDOW_MS;

    let cursor: string | undefined;
    for (;;) {
      // Honor cancellation between batches.
      const current = await this.prisma.broadcast.findUnique({
        where: { id: broadcastId },
        select: { status: true },
      });
      if (!current || current.status !== "SENDING") {
        this.logger.log(
          `broadcast ${broadcastId} status changed mid fan-out, stopping`,
        );
        return;
      }

      const contacts = await this.prisma.contact.findMany({
        where,
        orderBy: { id: "asc" },
        take: BATCH_SIZE,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
          id: true,
          lastInboundAt: true,
          conversation: { select: { id: true } },
        },
      });
      if (contacts.length === 0) break;

      let skippedInBatch = 0;
      for (const contact of contacts) {
        const inWindow =
          contact.lastInboundAt !== null &&
          contact.lastInboundAt.getTime() >= windowStart;
        if (!inWindow) {
          skippedInBatch += 1;
          continue;
        }
        await this.enqueueSend(
          broadcast.workspaceId,
          broadcast.igAccountId,
          broadcastId,
          broadcast.messageText,
          contact.id,
          contact.conversation?.id ?? null,
        );
      }

      if (skippedInBatch > 0) {
        await this.prisma.broadcast.update({
          where: { id: broadcastId },
          data: { skippedCount: { increment: skippedInBatch } },
        });
      }

      cursor = contacts[contacts.length - 1]!.id;
      if (contacts.length < BATCH_SIZE) break;
    }

    // Fan-out complete; guard on SENDING so a cancel isn't overwritten.
    await this.prisma.broadcast.updateMany({
      where: { id: broadcastId, status: "SENDING" },
      data: { status: "COMPLETED" },
    });
  }

  private async enqueueSend(
    workspaceId: string,
    igAccountId: string,
    broadcastId: string,
    text: string,
    contactId: string,
    conversationId: string | null,
  ): Promise<void> {
    if (!conversationId) {
      const conversation = await this.prisma.conversation.upsert({
        where: { contactId },
        create: { workspaceId, igAccountId, contactId },
        update: {},
        select: { id: true },
      });
      conversationId = conversation.id;
    }

    const message = await this.prisma.message.create({
      data: {
        workspaceId,
        conversationId,
        direction: "OUT",
        source: "BROADCAST",
        text,
        status: "QUEUED",
      },
      select: { id: true },
    });

    const payload: SendMessageJob = {
      workspaceId,
      igAccountId,
      contactId,
      messageId: message.id,
      text,
      source: "BROADCAST",
      broadcastId,
    };
    await this.sendQueue.add("send-message", payload, { jobId: message.id });
  }
}
