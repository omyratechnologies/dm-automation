import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import { ClerkAuthGuard } from "../auth/clerk-auth.guard";
import { AdminGuard } from "../auth/admin.guard";
import { CurrentUser } from "../auth/decorators";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import { AdminService } from "./admin.service";

@Controller("admin")
@UseGuards(ClerkAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("stats")
  getStats() {
    return this.admin.getPlatformStats();
  }

  @Get("users")
  listUsers(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.admin.listUsers(pageNum, limitNum, search || "");
  }

  @Get("users/:userId")
  getUserDetails(@Param("userId") userId: string) {
    return this.admin.getUserDetails(userId);
  }

  @Post("organizations/:orgId/override-subscription")
  overrideSubscription(
    @CurrentUser() adminUser: AuthedRequestUser,
    @Param("orgId") orgId: string,
    @Body("plan") plan: "FREE" | "PRO",
  ) {
    return this.admin.overrideSubscription(adminUser.id, orgId, plan);
  }

  @Get("webhooks")
  listWebhooks(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 15;
    return this.admin.listWebhookEvents(pageNum, limitNum, status);
  }

  @Post("webhooks/:webhookEventId/retry")
  retryWebhook(
    @CurrentUser() adminUser: AuthedRequestUser,
    @Param("webhookEventId") webhookEventId: string,
  ) {
    return this.admin.retryWebhookEvent(adminUser.id, webhookEventId);
  }
}
