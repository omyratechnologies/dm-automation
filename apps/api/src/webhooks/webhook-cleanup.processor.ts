import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { QUEUES } from "@repo/shared";
import { WebhookCleanupService } from "./webhook-cleanup.service";

@Processor(QUEUES.WEBHOOK_EVENT_CLEANUP)
export class WebhookCleanupProcessor extends WorkerHost {
  constructor(private readonly service: WebhookCleanupService) {
    super();
  }

  async process(job: Job): Promise<{ deleted: number }> {
    return this.service.deleteOldEvents();
  }
}
