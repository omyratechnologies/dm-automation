import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";
import { randomUUID } from "crypto";
import { QUEUES, type GoogleSheetsJob } from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { SheetsService } from "./sheets.service";

@Injectable()
export class SheetsReconciliationService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  constructor(private readonly prisma: PrismaService, private readonly sheets: SheetsService, @InjectQueue(QUEUES.GOOGLE_SHEETS) private readonly queue: Queue<GoogleSheetsJob>) {}

  onModuleInit(): void {
    if ((process.env.APP_ROLE ?? "api") !== "worker" || process.env.NODE_ENV === "test" || process.env.FEATURE_GOOGLE_SHEETS !== "true") return;
    this.timer = setInterval(() => void this.reconcile(), 15 * 60_000);
    this.timer.unref();
    void this.reconcile();
  }

  onModuleDestroy(): void { if (this.timer) clearInterval(this.timer); }

  private async reconcile(): Promise<void> {
    const channels = await this.prisma.googleWatchChannel.findMany({ where: { type: "DRIVE_CHANGES", status: "ACTIVE" } });
    for (const channel of channels) {
      const bucket = Math.floor(Date.now() / (15 * 60_000));
      await this.queue.add("drive-reconcile", { eventId: randomUUID(), workspaceId: channel.workspaceId, destinationId: channel.id, operation: "DRAIN_CHANGES" }, { jobId: `google-sheets-reconcile:${channel.id}:${bucket}` });
      if (channel.expiresAt.getTime() < Date.now() + 30 * 60 * 60_000) await this.sheets.ensureDriveWatch(channel.workspaceId, channel.bindingId);
    }
  }
}
