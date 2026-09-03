import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { QUEUES } from "@repo/shared";
import { GoogleModule } from "../google/google.module";
import { LeadsModule } from "../leads/leads.module";
import { BookingLinkGuard } from "./booking-link.guard";
import { CalendarController, GoogleCalendarWebhookController, PublicBookingController } from "./calendar.controller";
import { CalendarService } from "./calendar.service";
import { GoogleCalendarProcessor } from "./google-calendar.processor";
import { CalendarReconciliationService } from "./calendar-reconciliation.service";

const workerProviders = (process.env.APP_ROLE ?? "api") === "worker" && process.env.FEATURE_GOOGLE_CALENDAR === "true" ? [GoogleCalendarProcessor] : [];

@Module({
  imports: [GoogleModule, LeadsModule, BullModule.registerQueue({ name: QUEUES.GOOGLE_CALENDAR })],
  controllers: [CalendarController, PublicBookingController, GoogleCalendarWebhookController],
  providers: [CalendarService, BookingLinkGuard, CalendarReconciliationService, ...workerProviders],
  exports: [CalendarService],
})
export class CalendarModule {}
