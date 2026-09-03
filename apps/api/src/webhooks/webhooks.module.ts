import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { QUEUES } from "@repo/shared";
import { InboxModule } from "../inbox/inbox.module";
import { InstagramModule } from "../instagram/instagram.module";
import { AutomationsModule } from "../automations/automations.module";
import { WebhookCleanupProcessor } from "./webhook-cleanup.processor";
import { WebhookCleanupService } from "./webhook-cleanup.service";
import { WebhookEventsProcessor } from "./webhook-events.processor";
import { WebhooksController } from "./webhooks.controller";
import { LeadsModule } from "../leads/leads.module";

const workerProviders = (process.env.APP_ROLE ?? "api") === "worker"
  ? [WebhookEventsProcessor, WebhookCleanupProcessor]
  : [];

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUES.WEBHOOK_EVENTS }),
    BullModule.registerQueue({ name: QUEUES.FLOW_RUNS }),
    BullModule.registerQueue({ name: QUEUES.WEBHOOK_EVENT_CLEANUP }),
    InboxModule,
    InstagramModule,
    AutomationsModule,
    LeadsModule,
  ],
  controllers: [WebhooksController],
  providers: [
    WebhookCleanupService,
    ...workerProviders,
  ],
})
export class WebhooksModule {}
