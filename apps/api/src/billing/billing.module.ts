import { Module } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { StripeWebhookController } from "./stripe-webhook.controller";
import { BillingService } from "./billing.service";

@Module({
  controllers: [BillingController, StripeWebhookController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
