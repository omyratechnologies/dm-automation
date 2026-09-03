import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { QUEUES } from "@repo/shared";
import { SegmentsModule } from "../segments/segments.module";
import { BroadcastsController } from "./broadcasts.controller";
import { BroadcastsService } from "./broadcasts.service";
import { BroadcastsProcessor } from "./broadcasts.processor";

const workerProviders = (process.env.APP_ROLE ?? "api") === "worker" ? [BroadcastsProcessor] : [];

@Module({
  imports: [
    SegmentsModule,
    BullModule.registerQueue(
      { name: QUEUES.BROADCASTS },
      { name: QUEUES.SEND_MESSAGES },
    ),
  ],
  controllers: [BroadcastsController],
  providers: [BroadcastsService, ...workerProviders],
})
export class BroadcastsModule {}
