import { Module } from "@nestjs/common";
import { AutomationsController } from "./automations.controller";
import { AutomationsService } from "./automations.service";
import { AutomationsExecutorService } from "./automations-executor.service";
import { MessagingModule } from "../messaging/messaging.module";

@Module({
  imports: [MessagingModule],
  controllers: [AutomationsController],
  providers: [AutomationsService, AutomationsExecutorService],
  exports: [AutomationsExecutorService],
})
export class AutomationsModule {}
