import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { Public } from "../auth/public.decorator";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser, CurrentWorkspace } from "../auth/decorators";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { GdprService } from "./gdpr.service";

const daysSchema = z.coerce.number().int().min(1).max(365).default(30);

@ApiTags("gdpr")
@Controller()
export class GdprController {
  constructor(private readonly gdpr: GdprService) {}

  /** Meta app-deauthorize callback (x-www-form-urlencoded signed_request). */
  @Public()
  @Post("webhooks/meta/deauthorize")
  @HttpCode(HttpStatus.OK)
  deauthorize(@Body("signed_request") signedRequest?: string) {
    return this.gdpr.deauthorize(signedRequest);
  }

  /** Meta data-deletion callback (x-www-form-urlencoded signed_request). */
  @Public()
  @Post("webhooks/meta/data-deletion")
  @HttpCode(HttpStatus.OK)
  dataDeletion(@Body("signed_request") signedRequest?: string) {
    return this.gdpr.dataDeletion(signedRequest);
  }

  /** GDPR right-to-erasure at tenant level: purge the whole workspace. */
  @ApiBearerAuth()
  @Delete("workspaces/:workspaceId")
  @Roles("OWNER")
  deleteWorkspace(
    @CurrentUser() user: AuthedRequestUser,
    @CurrentWorkspace() ws: WorkspaceContext,
  ) {
    return this.gdpr.deleteWorkspace(ws, user);
  }

  @ApiBearerAuth()
  @Get("workspaces/:workspaceId/analytics/overview")
  analyticsOverview(
    @CurrentWorkspace() ws: WorkspaceContext,
    @Query("days", new ZodValidationPipe(daysSchema)) days: number,
  ) {
    return this.gdpr.analyticsOverview(ws.id, days);
  }
}
