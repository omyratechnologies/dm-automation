import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { TokenCrypto } from "../common/crypto/kms";
import { ProblemException } from "../common/problem-details";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class GoogleTokenService {
  private readonly cache = new Map<string, { token: string; expiresAt: number; version: number }>();
  private readonly refreshes = new Map<string, Promise<string>>();

  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService, private readonly crypto: TokenCrypto) {}

  async forBinding(workspaceId: string, bindingId: string, requiredScope?: string): Promise<string> {
    const binding = await this.prisma.googleBinding.findUnique({ where: { id_workspaceId: { id: bindingId, workspaceId } }, include: { grant: true } });
    if (!binding || binding.status !== "ACTIVE" || binding.grant.status !== "ACTIVE") throw new ProblemException(HttpStatus.CONFLICT, "GOOGLE_REAUTH_REQUIRED", "Google reconnection required", "The Google binding is not active");
    if (requiredScope && !binding.grant.scopes.includes(requiredScope)) throw new ProblemException(HttpStatus.FORBIDDEN, "GOOGLE_SCOPE_MISSING", "Google scope missing", "The connected Google account lacks a required scope");
    const cached = this.cache.get(binding.grantId);
    if (cached && cached.version === binding.grant.tokenVersion && cached.expiresAt > Date.now() + 60_000) return cached.token;
    const active = this.refreshes.get(binding.grantId);
    if (active) return active;
    if (!binding.grant.encryptedRefreshToken) throw new ProblemException(HttpStatus.CONFLICT, "GOOGLE_REAUTH_REQUIRED", "Google reconnection required", "The stored Google credential was removed");
    const refresh = this.refresh({ ...binding.grant, encryptedRefreshToken: binding.grant.encryptedRefreshToken }).finally(() => this.refreshes.delete(binding.grantId));
    this.refreshes.set(binding.grantId, refresh);
    return refresh;
  }

  private async refresh(grant: { id: string; encryptedRefreshToken: string; tokenVersion: number }): Promise<string> {
    try {
      const response = await axios.post<{ access_token: string; expires_in: number; refresh_token?: string }>("https://oauth2.googleapis.com/token", new URLSearchParams({
        client_id: this.config.getOrThrow("GOOGLE_CLIENT_ID"),
        client_secret: this.config.getOrThrow("GOOGLE_CLIENT_SECRET"),
        grant_type: "refresh_token",
        refresh_token: this.crypto.decrypt(grant.encryptedRefreshToken),
      }), { headers: { "content-type": "application/x-www-form-urlencoded" }, timeout: 15_000 });
      const tokenVersion = response.data.refresh_token ? grant.tokenVersion + 1 : grant.tokenVersion;
      await this.prisma.googleGrant.update({ where: { id: grant.id }, data: {
        lastRefreshAt: new Date(), status: "ACTIVE",
        ...(response.data.refresh_token ? { encryptedRefreshToken: this.crypto.encrypt(response.data.refresh_token), tokenVersion: { increment: 1 } } : {}),
      } });
      this.cache.set(grant.id, { token: response.data.access_token, expiresAt: Date.now() + response.data.expires_in * 1000, version: tokenVersion });
      return response.data.access_token;
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status === 400 || status === 401) await this.prisma.googleGrant.update({ where: { id: grant.id }, data: { status: "REAUTH_REQUIRED" } });
      throw new ProblemException(HttpStatus.SERVICE_UNAVAILABLE, status === 400 || status === 401 ? "GOOGLE_REAUTH_REQUIRED" : "GOOGLE_UNAVAILABLE", "Google authentication failed", status === 400 || status === 401 ? "Reconnect the Google account" : "Google is temporarily unavailable");
    }
  }
}
