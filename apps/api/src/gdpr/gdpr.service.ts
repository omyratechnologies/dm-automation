import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import type { WorkspaceContext } from "../auth/workspace.guard";

interface SignedRequestPayload {
  user_id?: string;
  algorithm?: string;
  issued_at?: number;
}

@Injectable()
export class GdprService {
  private readonly logger = new Logger(GdprService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------------------------------------------------------------------
  // Meta signed_request handling (deauthorize / data deletion callbacks)
  // ---------------------------------------------------------------------

  /**
   * Verify a Meta signed_request ("<sig>.<payload>", base64url) with
   * HMAC-SHA256 over the raw payload segment, then parse the payload JSON.
   */
  parseSignedRequest(signedRequest: unknown): SignedRequestPayload {
    if (typeof signedRequest !== "string" || !signedRequest.includes(".")) {
      throw new BadRequestException("Missing or malformed signed_request");
    }
    const secret = this.config.get<string>("INSTAGRAM_APP_SECRET") ?? "";
    if (!secret) {
      throw new BadRequestException("signed_request verification unavailable");
    }

    const [encodedSig, payload] = signedRequest.split(".", 2);
    let givenSig: Buffer;
    try {
      givenSig = Buffer.from(encodedSig, "base64url");
    } catch {
      throw new BadRequestException("Invalid signed_request signature");
    }
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest();
    // timingSafeEqual throws on length mismatch — treat that as a failure.
    if (
      givenSig.length !== expectedSig.length ||
      !crypto.timingSafeEqual(givenSig, expectedSig)
    ) {
      throw new BadRequestException("Invalid signed_request signature");
    }

    try {
      return JSON.parse(
        Buffer.from(payload, "base64url").toString("utf8"),
      ) as SignedRequestPayload;
    } catch {
      throw new BadRequestException("Invalid signed_request payload");
    }
  }

  /** User removed the app: disconnect their IG account(s). */
  async deauthorize(signedRequest: unknown): Promise<{ received: boolean }> {
    const payload = this.parseSignedRequest(signedRequest);
    const igUserId = payload.user_id;
    if (igUserId) {
      const res = await this.prisma.igAccount.updateMany({
        where: { igUserId },
        data: { status: "DISCONNECTED" },
      });
      this.logger.log(
        `deauthorize: disconnected ${res.count} ig account(s) for ${igUserId}`,
      );
    }
    return { received: true };
  }

  /**
   * Meta data-deletion callback: purge contact data for the IG user across
   * all workspaces, disconnect the account, and return a status URL +
   * confirmation code as Meta requires.
   */
  async dataDeletion(
    signedRequest: unknown,
  ): Promise<{ url: string; confirmation_code: string }> {
    const payload = this.parseSignedRequest(signedRequest);
    const igUserId = payload.user_id;
    const confirmationCode = crypto.randomBytes(6).toString("hex");

    const request = await this.prisma.dataDeletionRequest.create({
      data: { confirmationCode, userId: igUserId ?? null },
    });

    if (igUserId) {
      await this.prisma.contact.deleteMany({ where: { igUserId } });
      await this.prisma.igAccount.updateMany({
        where: { igUserId },
        data: { status: "DISCONNECTED" },
      });
    }

    await this.prisma.dataDeletionRequest.update({
      where: { id: request.id },
      data: { status: "completed", completedAt: new Date() },
    });

    const webOrigin =
      this.config.get<string>("WEB_ORIGIN") ?? "http://localhost:3000";
    return {
      url: `${webOrigin}/data-deletion-status/${confirmationCode}`,
      confirmation_code: confirmationCode,
    };
  }

  // ---------------------------------------------------------------------
  // Workspace deletion + analytics
  // ---------------------------------------------------------------------

  /** Hard-delete a workspace; cascades purge all tenant data. */
  async deleteWorkspace(
    ws: WorkspaceContext,
    user: AuthedRequestUser,
  ): Promise<{ deleted: boolean }> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: ws.id },
      select: { id: true, name: true },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");

    await this.prisma.workspace.delete({ where: { id: ws.id } });
    this.audit.log({
      organizationId: ws.organizationId,
      actorUserId: user.id,
      action: "workspace.deleted",
      targetType: "Workspace",
      targetId: ws.id,
      meta: { name: workspace.name },
    });
    return { deleted: true };
  }

  async analyticsOverview(workspaceId: string, days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const outWindow = {
      workspaceId,
      direction: "OUT" as const,
      createdAt: { gte: since },
    };

    const [
      sends,
      delivered,
      failed,
      rejected,
      inbound,
      newContacts,
      activeFlows,
      broadcasts,
    ] = await Promise.all([
      this.prisma.message.count({ where: outWindow }),
      this.prisma.message.count({ where: { ...outWindow, status: "SENT" } }),
      this.prisma.message.count({ where: { ...outWindow, status: "FAILED" } }),
      this.prisma.message.count({
        where: { ...outWindow, status: "REJECTED" },
      }),
      this.prisma.message.count({
        where: { workspaceId, direction: "IN", createdAt: { gte: since } },
      }),
      this.prisma.contact.count({
        where: { workspaceId, createdAt: { gte: since } },
      }),
      this.prisma.flow.count({ where: { workspaceId, status: "ACTIVE" } }),
      this.prisma.broadcast.count({
        where: { workspaceId, createdAt: { gte: since } },
      }),
    ]);

    return {
      days,
      sends,
      delivered,
      failed,
      rejected,
      inbound,
      newContacts,
      activeFlows,
      broadcasts,
    };
  }
}
