import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuditService } from "../audit/audit.service";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { TokenCrypto } from "../common/crypto/kms";
import { PrismaService } from "../prisma/prisma.service";
import { IgGraphClient } from "./ig-graph.client";

/** Public (token-free) shape of an IgAccount. Tokens never leave the API. */
const IG_ACCOUNT_SELECT = {
  id: true,
  workspaceId: true,
  igUserId: true,
  username: true,
  status: true,
  tokenExpiresAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const DEFAULT_TOKEN_TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

@Injectable()
export class IgAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly graph: IgGraphClient,
    private readonly tokenCrypto: TokenCrypto,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  async list(workspaceId: string) {
    return this.prisma.igAccount.findMany({
      where: { workspaceId },
      select: IG_ACCOUNT_SELECT,
      orderBy: { createdAt: "asc" },
    });
  }

  async connect(
    workspace: WorkspaceContext,
    user: AuthedRequestUser,
    input: { code: string; redirectUri?: string },
  ) {
    const redirectUri =
      input.redirectUri ??
      this.config.get<string>("INSTAGRAM_OAUTH_REDIRECT_URI");
    if (!redirectUri) {
      throw new BadRequestException(
        "redirectUri is required (INSTAGRAM_OAUTH_REDIRECT_URI is not configured)",
      );
    }

    const shortLived = await this.graph.exchangeCodeForToken(
      input.code,
      redirectUri,
    );
    const longLived = await this.graph.getLongLivedToken(
      shortLived.accessToken,
    );
    const me = await this.graph.getMe(longLived.accessToken);

    const igUserId = me.userId ?? shortLived.userId;
    if (!igUserId) {
      throw new BadRequestException(
        "Could not resolve Instagram user id from token",
      );
    }

    const existing = await this.prisma.igAccount.findUnique({
      where: { igUserId },
      select: { id: true, workspaceId: true },
    });
    if (existing && existing.workspaceId !== workspace.id) {
      throw new ConflictException(
        "This Instagram account is already connected to another workspace",
      );
    }

    const tokenEncrypted = this.tokenCrypto.encrypt(longLived.accessToken);
    const ttlMs = longLived.expiresIn
      ? longLived.expiresIn * 1000
      : DEFAULT_TOKEN_TTL_MS;
    const tokenExpiresAt = new Date(Date.now() + ttlMs);

    const account = await this.prisma.igAccount.upsert({
      where: { igUserId },
      create: {
        workspaceId: workspace.id,
        igUserId,
        username: me.username ?? null,
        tokenEncrypted,
        tokenExpiresAt,
        status: "ACTIVE",
      },
      update: {
        username: me.username ?? undefined,
        tokenEncrypted,
        tokenExpiresAt,
        status: "ACTIVE",
      },
      select: IG_ACCOUNT_SELECT,
    });

    await this.graph.subscribeToWebhooks(igUserId, longLived.accessToken);

    this.audit.log({
      organizationId: workspace.organizationId,
      workspaceId: workspace.id,
      actorUserId: user.id,
      action: "ig_account.connected",
      targetType: "IgAccount",
      targetId: account.id,
      meta: { igUserId, username: account.username },
    });

    return account;
  }

  async getById(workspaceId: string, id: string) {
    const account = await this.prisma.igAccount.findFirst({
      where: { id, workspaceId },
      select: IG_ACCOUNT_SELECT,
    });
    if (!account) throw new NotFoundException("Instagram account not found");
    return account;
  }

  async getMedia(workspaceId: string, id: string) {
    const account = await this.prisma.igAccount.findFirst({
      where: { id, workspaceId },
      select: { id: true, tokenEncrypted: true, igUserId: true },
    });
    if (!account) throw new NotFoundException("Instagram account not found");

    const token = this.tokenCrypto.decrypt(account.tokenEncrypted);
    const media = await this.graph.getMedia(token);

    return { igUserId: account.igUserId, media: media.data ?? [] };
  }

  async disconnect(
    workspace: WorkspaceContext,
    user: AuthedRequestUser,
    id: string,
  ) {
    const account = await this.prisma.igAccount.findFirst({
      where: { id, workspaceId: workspace.id },
      select: { id: true },
    });
    if (!account) throw new NotFoundException("Instagram account not found");

    const updated = await this.prisma.igAccount.update({
      where: { id },
      data: { status: "DISCONNECTED" },
      select: IG_ACCOUNT_SELECT,
    });

    this.audit.log({
      organizationId: workspace.organizationId,
      workspaceId: workspace.id,
      actorUserId: user.id,
      action: "ig_account.disconnected",
      targetType: "IgAccount",
      targetId: id,
    });

    return updated;
  }
}
