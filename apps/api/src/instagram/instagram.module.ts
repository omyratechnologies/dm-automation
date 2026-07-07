import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { QUEUES } from "@repo/shared";
import { IgAccountsController } from "./ig-accounts.controller";
import { IgAccountsService } from "./ig-accounts.service";
import { IgGraphClient } from "./ig-graph.client";
import { TokenRefreshService } from "./token-refresh.service";
import { TokenRefreshProcessor } from "./token-refresh.processor";

@Module({
  imports: [BullModule.registerQueue({ name: QUEUES.TOKEN_REFRESH })],
  controllers: [IgAccountsController],
  providers: [IgGraphClient, IgAccountsService, TokenRefreshService, TokenRefreshProcessor],
  exports: [IgGraphClient],
})
export class InstagramModule {}
