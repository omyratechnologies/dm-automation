import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import type { OutboxEvent } from "@prisma/client";
import { Queue } from "bullmq";
import { QUEUES } from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OutboxRelayService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelayService.name);
  private timer?: NodeJS.Timeout;
  private polling = false;

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUES.GOOGLE_CALENDAR) private readonly calendarQueue: Queue,
    @InjectQueue(QUEUES.GOOGLE_SHEETS) private readonly sheetsQueue: Queue,
  ) {}

  onModuleInit(): void {
    if ((process.env.APP_ROLE ?? "api") !== "relay" || process.env.NODE_ENV === "test") return;
    this.timer = setInterval(() => void this.poll(), 500);
    this.timer.unref();
    void this.poll();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async poll(): Promise<void> {
    if (this.polling) return;
    this.polling = true;
    try {
      const events = await this.reserveBatch();
      for (const event of events) await this.publish(event);
    } catch (error) {
      this.logger.error(`outbox relay failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.polling = false;
    }
  }

  private reserveBatch(): Promise<OutboxEvent[]> {
    return this.prisma.$transaction(async (tx) => {
      const events = await tx.$queryRaw<OutboxEvent[]>`
        SELECT * FROM "OutboxEvent"
        WHERE "status" = 'PENDING' AND "availableAt" <= now()
        ORDER BY "occurredAt" ASC
        LIMIT 100
        FOR UPDATE SKIP LOCKED
      `;
      if (events.length) {
        await tx.outboxEvent.updateMany({
          where: { id: { in: events.map((event) => event.id) } },
          data: { attempts: { increment: 1 }, availableAt: new Date(Date.now() + 30_000) },
        });
      }
      return events;
    });
  }

  private async publish(event: OutboxEvent): Promise<void> {
    try {
      if (event.type.startsWith("Lead") || event.type.startsWith("Sheet")) {
        const destinations = await this.prisma.sheetDestination.findMany({
          where: {
            workspaceId: event.workspaceId,
            status: "ACTIVE",
            ...(event.type === "SheetInboundApplied" && typeof event.payload === "object" && event.payload !== null && !Array.isArray(event.payload) && typeof (event.payload as Record<string, unknown>).destinationId === "string"
              ? { id: { not: (event.payload as Record<string, unknown>).destinationId as string } }
              : {}),
          },
          select: { id: true },
        });
        for (const destination of destinations) {
          await this.sheetsQueue.add(
            "domain-event",
            {
              eventId: event.eventId,
              workspaceId: event.workspaceId,
              destinationId: destination.id,
              operation: "PROJECT_LEAD",
              leadId: event.aggregateType === "Lead" ? event.aggregateId : undefined,
            },
            { jobId: `google-sheets-${destination.id}:${event.eventId}` },
          );
        }
      }
      if (event.type === "MeetingChanged") {
        const meeting = await this.prisma.leadMeeting.findUnique({ where: { id_workspaceId: { id: event.aggregateId, workspaceId: event.workspaceId } }, select: { status: true, providerEventId: true } });
        if (meeting) {
          const operation = meeting.status === "CANCELED" ? "CANCEL" : meeting.providerEventId ? "UPDATE" : "CREATE";
          await this.calendarQueue.add(
            "domain-event",
            { eventId: event.eventId, workspaceId: event.workspaceId, meetingId: event.aggregateId, operation },
            { jobId: `google-calendar:${event.eventId}` },
          );
        }
      }
      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: { status: "PUBLISHED", publishedAt: new Date(), lastError: null },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: event.attempts >= 20 ? "FAILED" : "PENDING",
          lastError: message.slice(0, 500),
          availableAt: new Date(Date.now() + Math.min(300_000, 1000 * 2 ** Math.min(event.attempts, 8))),
        },
      });
      throw error;
    }
  }
}
