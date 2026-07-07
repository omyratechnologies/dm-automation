import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { QUEUES } from "@repo/shared";
import { InboxModule } from "../inbox/inbox.module";
import { InstagramModule } from "../instagram/instagram.module";
import { ConversationsController } from "./conversations.controller";
import { MessagingService } from "./messaging.service";
import { RateLimiterService } from "./rate-limiter.service";
import { SendProcessor } from "./send.processor";

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUES.SEND_MESSAGES,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 30_000 },
      },
    }),
    InstagramModule,
    InboxModule,
  ],
  controllers: [ConversationsController],
  providers: [MessagingService, SendProcessor, RateLimiterService],
  exports: [MessagingService],
})
export class MessagingModule {}
