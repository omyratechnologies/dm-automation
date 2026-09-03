import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { createHash, randomBytes } from "crypto";
import type { GOOGLE_BINDING_OWNERSHIP, GOOGLE_CAPABILITY } from "@prisma/client";
import type { GoogleIntegrationReadiness } from "@repo/shared";
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
    if (input.ownership === "WORKSPACE") {
      const member = await this.prisma.membership.findUnique({ where: { id_workspaceId: { id: input.membershipId, workspaceId: input.workspaceId } } });
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
      returnPath: input.returnPath.startsWith("/") ? input.returnPath : "/dashboard",
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

    const existing = await this.prisma.googleGrant.findUnique({
      where: { userId_googleSub_oauthClientId: { userId: session.userId, googleSub: tokenInfo.data.sub, oauthClientId: this.config.getOrThrow("GOOGLE_CLIENT_ID") } },
    });
    if (!tokens.refresh_token && !existing?.encryptedRefreshToken) throw new ProblemException(HttpStatus.BAD_REQUEST, "GOOGLE_REAUTH_REQUIRED", "Offline access missing", "Google did not return a refresh token; reconnect and grant offline access");
    const encryptedRefreshToken = tokens.refresh_token ? this.crypto.encrypt(tokens.refresh_token) : existing!.encryptedRefreshToken!;
    const grant = await this.prisma.googleGrant.upsert({
      where: { userId_googleSub_oauthClientId: { userId: session.userId, googleSub: tokenInfo.data.sub, oauthClientId: this.config.getOrThrow("GOOGLE_CLIENT_ID") } },
      create: { userId: session.userId, googleSub: tokenInfo.data.sub, email: tokenInfo.data.email, oauthClientId: this.config.getOrThrow("GOOGLE_CLIENT_ID"), encryptedRefreshToken, scopes: grantedScopes },
      update: { email: tokenInfo.data.email, encryptedRefreshToken, scopes: grantedScopes, status: "ACTIVE", tokenVersion: { increment: 1 } },
    });
    const binding = await this.prisma.googleBinding.upsert({
      where: { workspaceId_grantId_ownership_authorizedMembershipId: { workspaceId: session.workspaceId, grantId: grant.id, ownership: session.ownership, authorizedMembershipId: session.authorizedMembershipId } },
      create: { workspaceId: session.workspaceId, grantId: grant.id, ownership: session.ownership, authorizedMembershipId: session.authorizedMembershipId, capabilities: session.capabilities, status: "ACTIVE", lastHealthAt: new Date() },
      update: { capabilities: session.capabilities, status: "ACTIVE", lastHealthAt: new Date(), lastErrorCode: null, version: { increment: 1 } },
    });
    return { bindingId: binding.id, workspaceId: binding.workspaceId, returnPath: session.returnPath };
  }

  async disconnectBinding(workspaceId: string, bindingId: string, expectedVersion: number) {
    const updated = await this.prisma.googleBinding.updateMany({
      where: { id: bindingId, workspaceId, version: expectedVersion, status: { not: "DISCONNECTED" } },
      data: { status: "DISCONNECTED", version: { increment: 1 }, lastErrorCode: null },
    });
    if (updated.count !== 1) throw new ProblemException(HttpStatus.PRECONDITION_FAILED, "VERSION_CONFLICT", "Version conflict", "The Google binding changed after it was loaded");
    await this.prisma.googleWatchChannel.updateMany({ where: { bindingId, workspaceId, status: "ACTIVE" }, data: { status: "STOPPED" } });
    return { disconnected: true };
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

  private assertConfigured(): void {
    if (!this.readiness().oauth.available) {
      throw new ProblemException(HttpStatus.SERVICE_UNAVAILABLE, "GOOGLE_UNAVAILABLE", "Google integration unavailable", "Google OAuth is not configured or enabled");
    }
  }
}
