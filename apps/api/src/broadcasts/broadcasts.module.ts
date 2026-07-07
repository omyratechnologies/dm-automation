import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { QUEUES } from "@repo/shared";
import { SegmentsModule } from "../segments/segments.module";
import { BroadcastsController } from "./broadcasts.controller";
import { BroadcastsService } from "./broadcasts.service";
import { BroadcastsProcessor } from "./broadcasts.processor";

@Module({
  imports: [
    SegmentsModule,
    BullModule.registerQueue(
      { name: QUEUES.BROADCASTS },
      { name: QUEUES.SEND_MESSAGES },
    ),
  ],
  controllers: [BroadcastsController],
  providers: [BroadcastsService, BroadcastsProcessor],
})
export class BroadcastsModule {}
