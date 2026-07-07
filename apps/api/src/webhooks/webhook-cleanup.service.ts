import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { QUEUES } from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";

/** Keep webhook events for 30 days, then delete. */
const RETENTION_DAYS = 30;

@Injectable()
export class WebhookCleanupService implements OnModuleInit {
  private readonly logger = new Logger(WebhookCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUES.WEBHOOK_EVENT_CLEANUP)
    private readonly queue: Queue,
  ) {}

  async onModuleInit() {
    const jobs = await this.queue.getRepeatableJobs();
    if (jobs.length === 0) {
      await this.queue.add(
        "cleanup",
        {},
        {
          repeat: { pattern: "0 4 * * *" },
          removeOnComplete: { age: 86400 },
          removeOnFail: { age: 86400 },
        },
      );
      this.logger.log("Scheduled daily webhook cleanup job at 04:00 UTC");
    }
  }

  async deleteOldEvents(): Promise<{ deleted: number }> {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400 * 1000);
    const result = await this.prisma.webhookEvent.deleteMany({
      where: { receivedAt: { lt: cutoff } },
    });
    this.logger.log(`Deleted ${result.count} old webhook events`);
    return { deleted: result.count };
  }
}
