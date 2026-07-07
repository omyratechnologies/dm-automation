import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { QUEUES } from "@repo/shared";
import { InstagramModule } from "../instagram/instagram.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [BullModule.registerQueue({ name: QUEUES.SEND_MESSAGES }), InstagramModule],
  controllers: [HealthController],
})
export class HealthModule {}
