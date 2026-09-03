import { Body, Controller, Delete, Get, Headers, HttpStatus, Param, Post, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { z } from "zod";
import { CurrentUser, CurrentWorkspace } from "../auth/decorators";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import { RequireCapabilities, WorkspaceScoped } from "../auth/capabilities.decorator";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { Public } from "../auth/public.decorator";
import { IdempotentCommand } from "../common/idempotency";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { PrismaService } from "../prisma/prisma.service";
import { GoogleApiClient } from "./google-api.client";
import { GoogleOAuthService } from "./google-oauth.service";
import { ProblemException } from "../common/problem-details";
import { FeatureFlag } from "../common/feature-flag";

const startSchema = z.object({
  ownership: z.enum(["MEMBER", "WORKSPACE"]),
  capabilities: z.array(z.enum(["CALENDAR", "SHEETS"])).min(1),
  returnPath: z.string().max(500).default("/dashboard"),
});

@Controller("workspaces/:workspaceId/google")
@WorkspaceScoped()
@FeatureFlag("FEATURE_GOOGLE_OAUTH")
export class GoogleController {
  constructor(private readonly oauth: GoogleOAuthService, private readonly prisma: PrismaService, private readonly api: GoogleApiClient) {}

  @Post("oauth-sessions")
  @RequireCapabilities("integrations.manage")
  @IdempotentCommand()
  start(@CurrentUser() user: AuthedRequestUser, @CurrentWorkspace() workspace: WorkspaceContext, @Body(new ZodValidationPipe(startSchema)) input: z.infer<typeof startSchema>) {
    return this.oauth.start({ userId: user.id, workspaceId: workspace.id, membershipId: workspace.membershipId!, ...input });
  }

  @Get("bindings")
  @RequireCapabilities("integrations.manage")
  list(@CurrentWorkspace() workspace: WorkspaceContext) {
    return this.prisma.googleBinding.findMany({ where: { workspaceId: workspace.id }, select: { id: true, grantId: true, ownership: true, capabilities: true, status: true, version: true, lastHealthAt: true, lastErrorCode: true, grant: { select: { email: true, scopes: true } } } });
  }

  @Get("bindings/:bindingId/calendars")
  @RequireCapabilities("integrations.manage")
  calendars(@CurrentWorkspace() workspace: WorkspaceContext, @Param("bindingId") bindingId: string) {
    return this.api.listCalendars(workspace.id, bindingId);
  }

  @Delete("bindings/:bindingId")
  @RequireCapabilities("integrations.manage")
  @IdempotentCommand()
  disconnect(@CurrentWorkspace() workspace: WorkspaceContext, @Param("bindingId") bindingId: string, @Headers("if-match") ifMatch?: string) {
    return this.oauth.disconnectBinding(workspace.id, bindingId, this.version(ifMatch));
  }

  @Delete("grants/:grantId")
  @RequireCapabilities("integrations.manage")
  @IdempotentCommand()
  removeAll(@CurrentUser() user: AuthedRequestUser, @Param("grantId") grantId: string) {
    return this.oauth.removeAllAccess(user.id, grantId);
  }

  private version(value?: string): number {
    if (!value) throw new ProblemException(HttpStatus.PRECONDITION_REQUIRED, "PRECONDITION_REQUIRED", "Precondition required", "Provide If-Match with the current Google binding version");
    const version = Number(value.replace(/^W\//, "").replaceAll('"', ""));
    if (!Number.isInteger(version) || version < 1) throw new ProblemException(HttpStatus.BAD_REQUEST, "INVALID_IF_MATCH", "Invalid If-Match", "If-Match must contain a positive integer version");
    return version;
  }
}

@Controller("google/oauth")
@FeatureFlag("FEATURE_GOOGLE_OAUTH")
export class GoogleOAuthCallbackController {
  constructor(private readonly oauth: GoogleOAuthService) {}

  @Get("callback")
  @Public()
  callback(@Query("state") state: string, @Query("code") code: string, @Req() _request: Request) {
    return this.oauth.callback(state, code);
  }
}
