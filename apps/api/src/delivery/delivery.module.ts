import { BullModule } from "@nestjs/bullmq";
import { Global, Module } from "@nestjs/common";
import { QUEUES } from "@repo/shared";
import { OutboxRelayService } from "./outbox-relay.service";
import { OutboxService } from "./outbox.service";
import { ProcessedEventService } from "./processed-event.service";

@Global()
@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUES.GOOGLE_CALENDAR }),
    BullModule.registerQueue({ name: QUEUES.GOOGLE_SHEETS }),
  ],
  providers: [OutboxService, ProcessedEventService, OutboxRelayService],
  exports: [OutboxService, ProcessedEventService],
})
export class DeliveryModule {}
