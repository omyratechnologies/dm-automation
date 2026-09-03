import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";
import { randomUUID } from "crypto";
import { QUEUES, type GoogleCalendarJob } from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { CalendarService } from "./calendar.service";

@Injectable()
export class CalendarReconciliationService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  constructor(private readonly prisma: PrismaService, private readonly calendar: CalendarService, @InjectQueue(QUEUES.GOOGLE_CALENDAR) private readonly queue: Queue<GoogleCalendarJob>) {}
  onModuleInit(): void {
    if ((process.env.APP_ROLE ?? "api") !== "worker" || process.env.NODE_ENV === "test" || process.env.FEATURE_GOOGLE_CALENDAR !== "true") return;
    this.timer = setInterval(() => void this.reconcile(), 15 * 60_000);
    this.timer.unref();
    void this.reconcile();
  }
  onModuleDestroy(): void { if (this.timer) clearInterval(this.timer); }
  private async reconcile(): Promise<void> {
    const channels = await this.prisma.googleWatchChannel.findMany({ where: { type: "CALENDAR_EVENTS", status: "ACTIVE" } });
    for (const channel of channels) {
      await this.queue.add("calendar-reconcile", { eventId: randomUUID(), workspaceId: channel.workspaceId, meetingId: channel.id, operation: "SYNC_CALENDAR" }, { jobId: `google-calendar-reconcile:${channel.id}:${Math.floor(Date.now() / (15 * 60_000))}` });
      if (channel.expiresAt.getTime() < Date.now() + 30 * 60 * 60_000 && channel.calendarId) {
        const member = await this.prisma.calendarPoolMember.findFirst({ where: { workspaceId: channel.workspaceId, googleBindingId: channel.bindingId, calendarId: channel.calendarId } });
        if (member) await this.calendar.ensureCalendarWatch(member.id);
      }
    }
  }
}
