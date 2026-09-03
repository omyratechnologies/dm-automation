import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { QUEUES } from "@repo/shared";
import { GoogleModule } from "../google/google.module";
import { LeadsModule } from "../leads/leads.module";
import { GoogleSheetsProcessor } from "./google-sheets.processor";
import { GoogleDriveWebhookController, SheetsController } from "./sheets.controller";
import { SheetsService } from "./sheets.service";
import { SheetsReconciliationService } from "./sheets-reconciliation.service";
import { SpreadsheetLockService } from "./spreadsheet-lock.service";

const workerProviders = (process.env.APP_ROLE ?? "api") === "worker" && process.env.FEATURE_GOOGLE_SHEETS === "true" ? [GoogleSheetsProcessor] : [];

@Module({
  imports: [GoogleModule, LeadsModule, BullModule.registerQueue({ name: QUEUES.GOOGLE_SHEETS })],
  controllers: [SheetsController, GoogleDriveWebhookController],
  providers: [SheetsService, SheetsReconciliationService, SpreadsheetLockService, ...workerProviders],
  exports: [SheetsService],
})
export class SheetsModule {}
