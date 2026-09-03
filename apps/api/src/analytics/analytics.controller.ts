import { Controller, Get, Query } from "@nestjs/common";
import { z } from "zod";
import { CurrentWorkspace } from "../auth/decorators";
import { RequireCapabilities, WorkspaceScoped } from "../auth/capabilities.decorator";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AnalyticsService } from "./analytics.service";

const daysSchema = z.coerce.number().int().min(1).max(365).default(30);

@Controller("workspaces/:workspaceId/analytics")
@WorkspaceScoped()
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get("overview")
  @RequireCapabilities("analytics.read")
  overview(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Query("days", new ZodValidationPipe(daysSchema)) days: number,
  ) {
    return this.analytics.overview(workspace.id, days);
  }
}
