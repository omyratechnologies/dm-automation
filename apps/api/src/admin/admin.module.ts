import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { QUEUES } from "@repo/shared";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUES.WEBHOOK_EVENTS }),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
