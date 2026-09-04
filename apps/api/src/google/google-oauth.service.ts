import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { createHash, randomBytes } from "crypto";
import type { GOOGLE_BINDING_OWNERSHIP, GOOGLE_CAPABILITY } from "@prisma/client";
import type { GoogleIntegrationReadiness } from "@repo/shared";
import { AuditService } from "../audit/audit.service";
import { TokenCrypto } from "../common/crypto/kms";
import { ProblemException } from "../common/problem-details";
import { PrismaService } from "../prisma/prisma.service";

const OIDC_SCOPES = ["openid", "email"];
const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  "https://www.googleapis.com/auth/calendar.events.freebusy",
  "https://www.googleapis.com/auth/calendar.events.owned",
];
const SHEETS_SCOPES = ["https://www.googleapis.com/auth/drive.file"];

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  id_token: string;
}

@Injectable()
export class GoogleOAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly crypto: TokenCrypto,
    private readonly audit: AuditService,
  ) {}

  readiness(): GoogleIntegrationReadiness {
    const oauthEnabled = this.config.get<boolean>("FEATURE_GOOGLE_OAUTH") === true;
    const oauthConfigured = Boolean(
      this.config.get("GOOGLE_CLIENT_ID")
      && this.config.get("GOOGLE_CLIENT_SECRET")
      && this.config.get("GOOGLE_OAUTH_REDIRECT_URI"),
    );
    const oauth = !oauthEnabled
      ? { available: false, status: "FEATURE_DISABLED" as const }
      : !oauthConfigured
        ? { available: false, status: "ADMIN_SETUP_REQUIRED" as const }
        : { available: true, status: "AVAILABLE" as const };

    const capability = (flag: "FEATURE_GOOGLE_CALENDAR" | "FEATURE_GOOGLE_SHEETS") => {
      if (this.config.get<boolean>(flag) !== true) {
        return { available: false, status: "FEATURE_DISABLED" as const };
      }
      return oauth;
    };

    return {
      oauth,
      calendar: capability("FEATURE_GOOGLE_CALENDAR"),
      sheets: capability("FEATURE_GOOGLE_SHEETS"),
    };
  }

  async start(input: {
    userId: string;
    workspaceId: string;
    membershipId: string;
    ownership: GOOGLE_BINDING_OWNERSHIP;
    capabilities: GOOGLE_CAPABILITY[];
    returnPath: string;
  }) {
    this.assertConfigured();
    for (const capability of input.capabilities) {
      const flag = capability === "CALENDAR" ? "FEATURE_GOOGLE_CALENDAR" : "FEATURE_GOOGLE_SHEETS";
      if (this.config.get<boolean>(flag) !== true) {
        throw new ProblemException(HttpStatus.SERVICE_UNAVAILABLE, "FEATURE_DISABLED", "Google capability unavailable", `Google ${capability.toLowerCase()} is not enabled for this deployment`);
      }
    }
    const member = await this.prisma.membership.findUnique({ where: { id_workspaceId: { id: input.membershipId, workspaceId: input.workspaceId } } });
    if (!member || member.status !== "ACTIVE") {
      throw new ProblemException(HttpStatus.FORBIDDEN, "WORKSPACE_FORBIDDEN", "Workspace access required", "An active workspace membership is required to connect Google");
    }
    if (input.ownership === "MEMBER" && (input.capabilities.length !== 1 || input.capabilities[0] !== "CALENDAR")) {
      throw new ProblemException(HttpStatus.FORBIDDEN, "WORKSPACE_FORBIDDEN", "Member authorization invalid", "Member-owned Google access is limited to the member's Calendar");
    }
    if (input.ownership === "WORKSPACE") {
      if (!member || !["OWNER", "ADMIN"].includes(member.role)) throw new ProblemException(HttpStatus.FORBIDDEN, "WORKSPACE_FORBIDDEN", "Admin required", "Workspace-owned Google resources require Owner or Admin capability");
    }
    const state = randomBytes(32).toString("base64url");
    const verifier = randomBytes(64).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const scopes = [...new Set([
      ...OIDC_SCOPES,
      ...(input.capabilities.includes("CALENDAR") ? CALENDAR_SCOPES : []),
      ...(input.capabilities.includes("SHEETS") ? SHEETS_SCOPES : []),
    ])];
    await this.prisma.googleOAuthSession.create({ data: {
      userId: input.userId,
      workspaceId: input.workspaceId,
      authorizedMembershipId: input.membershipId,
      stateHash: this.hash(state),
      codeVerifierEncrypted: this.crypto.encrypt(verifier),
      ownership: input.ownership,
      capabilities: input.capabilities,
      requestedScopes: scopes,
      returnPath: this.safeReturnPath(input.returnPath),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    } });
    const params = new URLSearchParams({
      client_id: this.config.getOrThrow("GOOGLE_CLIENT_ID"),
      redirect_uri: this.config.getOrThrow("GOOGLE_OAUTH_REDIRECT_URI"),
      response_type: "code",
      scope: scopes.join(" "),
      access_type: "offline",
      include_granted_scopes: "true",
      prompt: "consent select_account",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });
    return { authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, expiresInSeconds: 600 };
  }

  async callback(state: string, code: string) {
    this.assertConfigured();
    const session = await this.prisma.googleOAuthSession.findUnique({ where: { stateHash: this.hash(state) } });
    if (!session || session.consumedAt || session.expiresAt <= new Date()) throw new ProblemException(HttpStatus.BAD_REQUEST, "OAUTH_STATE_INVALID", "OAuth session invalid", "The OAuth state is expired, invalid or already used");
    const consumed = await this.prisma.googleOAuthSession.updateMany({ where: { id: session.id, consumedAt: null, expiresAt: { gt: new Date() } }, data: { consumedAt: new Date() } });
    if (consumed.count !== 1) throw new ProblemException(HttpStatus.BAD_REQUEST, "OAUTH_STATE_REPLAYED", "OAuth state replayed", "This OAuth state was already consumed");

    const tokenResponse = await axios.post<TokenResponse>("https://oauth2.googleapis.com/token", new URLSearchParams({
      client_id: this.config.getOrThrow("GOOGLE_CLIENT_ID"),
      client_secret: this.config.getOrThrow("GOOGLE_CLIENT_SECRET"),
      redirect_uri: this.config.getOrThrow("GOOGLE_OAUTH_REDIRECT_URI"),
      grant_type: "authorization_code",
      code,
      code_verifier: this.crypto.decrypt(session.codeVerifierEncrypted),
    }), { headers: { "content-type": "application/x-www-form-urlencoded" }, timeout: 15_000 });
    const tokens = tokenResponse.data;
    const tokenInfo = await axios.post<{ sub: string; email?: string; aud: string }>("https://oauth2.googleapis.com/tokeninfo", new URLSearchParams({ id_token: tokens.id_token }), { headers: { "content-type": "application/x-www-form-urlencoded" }, timeout: 10_000 });
    if (tokenInfo.data.aud !== this.config.get("GOOGLE_CLIENT_ID")) throw new ProblemException(HttpStatus.BAD_REQUEST, "GOOGLE_ACCOUNT_INVALID", "Google identity invalid", "The Google token audience does not match this application");
    const grantedScopes = (tokens.scope ?? "").split(" ").filter(Boolean);
    const missing = session.requestedScopes.filter((scope) => !grantedScopes.includes(scope));
    if (missing.length) throw new ProblemException(HttpStatus.FORBIDDEN, "GOOGLE_SCOPE_MISSING", "Google scope missing", "Google did not grant all requested capabilities");

    const workspace = await this.prisma.workspace.findUnique({ where: { id: session.workspaceId }, select: { organizationId: true } });
    if (!workspace) throw new ProblemException(HttpStatus.FORBIDDEN, "WORKSPACE_FORBIDDEN", "Workspace unavailable", "The workspace is no longer available");
    const clientId = this.config.getOrThrow<string>("GOOGLE_CLIENT_ID");
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.googleGrant.findUnique({
        where: { userId_googleSub_oauthClientId: { userId: session.userId, googleSub: tokenInfo.data.sub, oauthClientId: clientId } },
      });
      if (!tokens.refresh_token && !existing?.encryptedRefreshToken) throw new ProblemException(HttpStatus.BAD_REQUEST, "GOOGLE_REAUTH_REQUIRED", "Offline access missing", "Google did not return a refresh token; reconnect and grant offline access");
      const encryptedRefreshToken = tokens.refresh_token ? this.crypto.encrypt(tokens.refresh_token) : existing!.encryptedRefreshToken!;
      const grant = await tx.googleGrant.upsert({
        where: { userId_googleSub_oauthClientId: { userId: session.userId, googleSub: tokenInfo.data.sub, oauthClientId: clientId } },
        create: { userId: session.userId, googleSub: tokenInfo.data.sub, email: tokenInfo.data.email, oauthClientId: clientId, encryptedRefreshToken, scopes: grantedScopes },
        update: { email: tokenInfo.data.email, encryptedRefreshToken, scopes: grantedScopes, status: "ACTIVE", tokenVersion: { increment: 1 } },
      });
      const binding = await tx.googleBinding.upsert({
        where: { workspaceId_grantId_ownership_authorizedMembershipId: { workspaceId: session.workspaceId, grantId: grant.id, ownership: session.ownership, authorizedMembershipId: session.authorizedMembershipId } },
        create: { workspaceId: session.workspaceId, grantId: grant.id, ownership: session.ownership, authorizedMembershipId: session.authorizedMembershipId, capabilities: session.capabilities, status: "ACTIVE", lastHealthAt: new Date() },
        update: { capabilities: session.capabilities, status: "ACTIVE", lastHealthAt: new Date(), lastErrorCode: null, version: { increment: 1 } },
      });
      await this.audit.logInTransaction(tx, {
        organizationId: workspace.organizationId,
        workspaceId: session.workspaceId,
        actorUserId: session.userId,
        actorType: "USER",
        source: "GOOGLE_OAUTH",
        action: "google.binding.connected",
        targetType: "GoogleBinding",
        targetId: binding.id,
        meta: { ownership: session.ownership, capabilities: session.capabilities },
      });
      return { bindingId: binding.id, workspaceId: binding.workspaceId, returnPath: this.safeReturnPath(session.returnPath) };
    });
  }

  async returnPathForState(state?: string): Promise<string> {
    if (!state) return "/dashboard";
    const session = await this.prisma.googleOAuthSession.findUnique({ where: { stateHash: this.hash(state) }, select: { returnPath: true } });
    return this.safeReturnPath(session?.returnPath ?? "/dashboard");
  }

  async cancel(state: string): Promise<{ returnPath: string }> {
    const session = await this.prisma.googleOAuthSession.findUnique({ where: { stateHash: this.hash(state) } });
    if (!session || session.consumedAt || session.expiresAt <= new Date()) {
      throw new ProblemException(HttpStatus.BAD_REQUEST, "OAUTH_STATE_INVALID", "OAuth session invalid", "The OAuth state is expired, invalid or already used");
    }
    const consumed = await this.prisma.googleOAuthSession.updateMany({ where: { id: session.id, consumedAt: null, expiresAt: { gt: new Date() } }, data: { consumedAt: new Date() } });
    if (consumed.count !== 1) throw new ProblemException(HttpStatus.BAD_REQUEST, "OAUTH_STATE_REPLAYED", "OAuth state replayed", "This OAuth state was already consumed");
    return { returnPath: this.safeReturnPath(session.returnPath) };
  }

  frontendRedirect(returnPath: string, status: "connected" | "cancelled" | "error", code?: string): string {
    const origin = this.config.get<string>("WEB_ORIGIN")?.split(",")[0]?.trim().replace(/\/$/, "") || "http://localhost:3000";
    const target = new URL(this.safeReturnPath(returnPath), `${origin}/`);
    target.searchParams.set("google", status);
    if (code) target.searchParams.set("code", code);
    return target.toString();
  }

  async disconnectBinding(input: {
    workspaceId: string;
    organizationId: string;
    bindingId: string;
    expectedVersion: number;
    actorUserId: string;
    actorMembershipId: string;
    actorRole: "OWNER" | "ADMIN" | "AGENT";
  }) {
    return this.prisma.$transaction(async (tx) => {
      const binding = await tx.googleBinding.findUnique({
        where: { id_workspaceId: { id: input.bindingId, workspaceId: input.workspaceId } },
        include: { grant: { select: { userId: true } } },
      });
      if (!binding) throw new ProblemException(HttpStatus.NOT_FOUND, "GOOGLE_BINDING_NOT_FOUND", "Google connection not found", "The Google connection is unavailable in this workspace");
      const canDisconnectMember = binding.ownership === "MEMBER"
        && binding.authorizedMembershipId === input.actorMembershipId
        && binding.grant.userId === input.actorUserId;
      const canDisconnectWorkspace = binding.ownership === "WORKSPACE" && ["OWNER", "ADMIN"].includes(input.actorRole);
      if (!canDisconnectMember && !canDisconnectWorkspace) {
        throw new ProblemException(HttpStatus.FORBIDDEN, "WORKSPACE_FORBIDDEN", "Google connection protected", "Members can disconnect only their own Calendar connection");
      }
      const updated = await tx.googleBinding.updateMany({
        where: { id: input.bindingId, workspaceId: input.workspaceId, version: input.expectedVersion, status: { not: "DISCONNECTED" } },
        data: { status: "DISCONNECTED", version: { increment: 1 }, lastErrorCode: null },
      });
      if (updated.count !== 1) throw new ProblemException(HttpStatus.PRECONDITION_FAILED, "VERSION_CONFLICT", "Version conflict", "The Google binding changed after it was loaded");
      await tx.googleWatchChannel.updateMany({ where: { bindingId: input.bindingId, workspaceId: input.workspaceId, status: "ACTIVE" }, data: { status: "STOPPED" } });
      await this.audit.logInTransaction(tx, {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        actorType: "USER",
        action: "google.binding.disconnected",
        targetType: "GoogleBinding",
        targetId: input.bindingId,
      });
      return { disconnected: true };
    });
  }

  async removeAllAccess(userId: string, grantId: string) {
    const grant = await this.prisma.googleGrant.findFirst({ where: { id: grantId, userId } });
    if (!grant) throw new ProblemException(HttpStatus.NOT_FOUND, "GOOGLE_GRANT_NOT_FOUND", "Google grant not found", "The Google grant is unavailable");
    if (grant.encryptedRefreshToken) {
      try {
        await axios.post("https://oauth2.googleapis.com/revoke", new URLSearchParams({ token: this.crypto.decrypt(grant.encryptedRefreshToken) }), {
          headers: { "content-type": "application/x-www-form-urlencoded" }, timeout: 15_000,
        });
      } catch (error) {
        if (!axios.isAxiosError(error) || ![400, 401].includes(error.response?.status ?? 0)) {
          throw new ProblemException(HttpStatus.SERVICE_UNAVAILABLE, "GOOGLE_UNAVAILABLE", "Google unavailable", "Google access could not be revoked; retry before removing local credentials");
        }
      }
    }
    await this.prisma.$transaction([
      this.prisma.googleWatchChannel.updateMany({ where: { binding: { grantId } }, data: { status: "STOPPED" } }),
      this.prisma.googleBinding.updateMany({ where: { grantId }, data: { status: "DISCONNECTED", version: { increment: 1 }, lastErrorCode: "ACCESS_REVOKED" } }),
      this.prisma.googleGrant.update({ where: { id: grantId }, data: { status: "REVOKED", encryptedRefreshToken: null, tokenVersion: { increment: 1 } } }),
    ]);
    return { revoked: true };
  }

  private hash(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }

  private safeReturnPath(value: string): string {
    if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
    try {
      const origin = this.config.get<string>("WEB_ORIGIN")?.split(",")[0]?.trim() || "http://localhost:3000";
      const candidate = new URL(value, origin);
      if (candidate.origin !== new URL(origin).origin || !candidate.pathname.startsWith("/dashboard")) return "/dashboard";
      return `${candidate.pathname}${candidate.search}${candidate.hash}`;
    } catch {
      return "/dashboard";
    }
  }

  private assertConfigured(): void {
    if (!this.readiness().oauth.available) {
      throw new ProblemException(HttpStatus.SERVICE_UNAVAILABLE, "GOOGLE_UNAVAILABLE", "Google integration unavailable", "Google OAuth is not configured or enabled");
    }
  }
}
