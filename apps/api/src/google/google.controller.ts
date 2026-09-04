import { Body, Controller, Delete, Get, Headers, HttpException, HttpStatus, Param, Post, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";
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
export class GoogleController {
  constructor(private readonly oauth: GoogleOAuthService, private readonly prisma: PrismaService, private readonly api: GoogleApiClient) {}

  @Get("readiness")
  @RequireCapabilities("integrations.read")
  readiness() {
    return this.oauth.readiness();
  }

  @Post("oauth-sessions")
  @FeatureFlag("FEATURE_GOOGLE_OAUTH")
  @RequireCapabilities("integrations.connect")
  @IdempotentCommand()
  start(@CurrentUser() user: AuthedRequestUser, @CurrentWorkspace() workspace: WorkspaceContext, @Body(new ZodValidationPipe(startSchema)) input: z.infer<typeof startSchema>) {
    return this.oauth.start({ userId: user.id, workspaceId: workspace.id, membershipId: workspace.membershipId!, ...input });
  }

  @Get("bindings")
  @RequireCapabilities("integrations.read")
  async list(@CurrentUser() user: AuthedRequestUser, @CurrentWorkspace() workspace: WorkspaceContext) {
    const bindings = await this.prisma.googleBinding.findMany({ where: { workspaceId: workspace.id }, select: { id: true, grantId: true, authorizedMembershipId: true, ownership: true, capabilities: true, status: true, version: true, lastHealthAt: true, lastErrorCode: true, grant: { select: { userId: true, email: true, scopes: true } } } });
    return bindings.map(({ authorizedMembershipId, grant, ...binding }) => ({
      ...binding,
      grant: { email: grant.email, scopes: grant.scopes },
      canDisconnect: binding.ownership === "WORKSPACE"
        ? ["OWNER", "ADMIN"].includes(workspace.role)
        : authorizedMembershipId === workspace.membershipId && grant.userId === user.id,
    }));
  }

  @Get("bindings/:bindingId/calendars")
  @FeatureFlag("FEATURE_GOOGLE_CALENDAR")
  @RequireCapabilities("integrations.read")
  calendars(@CurrentWorkspace() workspace: WorkspaceContext, @Param("bindingId") bindingId: string) {
    return this.api.listCalendars(workspace.id, bindingId);
  }

  @Delete("bindings/:bindingId")
  @RequireCapabilities("integrations.connect")
  @IdempotentCommand()
  disconnect(@CurrentUser() user: AuthedRequestUser, @CurrentWorkspace() workspace: WorkspaceContext, @Param("bindingId") bindingId: string, @Headers("if-match") ifMatch?: string) {
    return this.oauth.disconnectBinding({ workspaceId: workspace.id, organizationId: workspace.organizationId, bindingId, expectedVersion: this.version(ifMatch), actorUserId: user.id, actorMembershipId: workspace.membershipId!, actorRole: workspace.role });
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
  @ApiOperation({ summary: "Complete Google account authorization" })
  @ApiQuery({ name: "state", required: false, description: "Single-use OAuth state returned by Google" })
  @ApiQuery({ name: "code", required: false, description: "Authorization code returned after consent" })
  @ApiQuery({ name: "error", required: false, description: "Provider error returned when consent is denied" })
  @ApiResponse({ status: 303, description: "Redirects to the safe Gemai dashboard return path with a non-sensitive result code" })
  async callback(
    @Query("state") state: string | undefined,
    @Query("code") code: string | undefined,
    @Query("error") providerError: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const returnPath = await this.oauth.returnPathForState(state);
    if (!state) {
      response.redirect(303, this.oauth.frontendRedirect(returnPath, "error", "OAUTH_STATE_INVALID"));
      return;
    }
    if (providerError) {
      try {
        const cancelled = await this.oauth.cancel(state);
        response.redirect(303, this.oauth.frontendRedirect(cancelled.returnPath, "cancelled", "GOOGLE_ACCESS_DENIED"));
      } catch (error) {
        response.redirect(303, this.oauth.frontendRedirect(returnPath, "error", this.problemCode(error)));
      }
      return;
    }
    if (!code) {
      response.redirect(303, this.oauth.frontendRedirect(returnPath, "error", "GOOGLE_OAUTH_RESPONSE_INVALID"));
      return;
    }
    try {
      const result = await this.oauth.callback(state, code);
      response.redirect(303, this.oauth.frontendRedirect(result.returnPath, "connected"));
    } catch (error) {
      response.redirect(303, this.oauth.frontendRedirect(returnPath, "error", this.problemCode(error)));
    }
  }

  private problemCode(error: unknown): string {
    if (error instanceof HttpException) {
      const body = error.getResponse();
      if (body && typeof body === "object" && "code" in body && typeof body.code === "string") return body.code;
    }
    return "GOOGLE_UNAVAILABLE";
  }
}
