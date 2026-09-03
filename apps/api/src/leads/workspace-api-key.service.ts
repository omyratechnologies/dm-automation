import { CanActivate, ExecutionContext, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, randomBytes } from "crypto";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { ProblemException } from "../common/problem-details";

@Injectable()
export class WorkspaceApiKeyService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async create(workspaceId: string, membershipId: string, name: string, expiresAt?: Date) {
    const prefix = randomBytes(5).toString("hex");
    const secret = randomBytes(32).toString("base64url");
    const plaintext = `gmk_${prefix}_${secret}`;
    const record = await this.prisma.workspaceApiKey.create({
      data: {
        workspaceId,
        createdByMembershipId: membershipId,
        name,
        keyPrefix: prefix,
        secretHash: this.hash(plaintext),
        scopes: ["leads:ingest"],
        expiresAt,
      },
      select: { id: true, name: true, keyPrefix: true, scopes: true, expiresAt: true, createdAt: true },
    });
    return { ...record, secret: plaintext };
  }

  async revoke(workspaceId: string, id: string) {
    const result = await this.prisma.workspaceApiKey.updateMany({
      where: { id, workspaceId, status: "ACTIVE" },
      data: { status: "REVOKED", revokedAt: new Date() },
    });
    if (!result.count) throw new ProblemException(HttpStatus.NOT_FOUND, "API_KEY_NOT_FOUND", "API key not found", "The API key is not active in this workspace");
    return { revoked: true };
  }

  hash(value: string): string {
    return createHash("sha256").update(`${this.config.get<string>("API_KEY_PEPPER") ?? ""}:${value}`).digest("hex");
  }
}

@Injectable()
export class WorkspaceApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService, private readonly keys: WorkspaceApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & {
      workspace?: { id: string; organizationId: string; role: "AGENT"; membershipId?: string };
      idempotencyActorId?: string;
    }>();
    const workspaceId = request.params.workspaceId;
    const plaintext = request.header("x-api-key") ?? request.header("authorization")?.replace(/^Bearer\s+/i, "");
    if (!workspaceId || !plaintext) throw new ProblemException(HttpStatus.UNAUTHORIZED, "API_KEY_INVALID", "API key required", "Provide a scoped workspace API key");
    const key = await this.prisma.workspaceApiKey.findUnique({
      where: { secretHash: this.keys.hash(plaintext) },
      include: { workspace: { select: { organizationId: true } } },
    });
    if (!key || key.workspaceId !== workspaceId || key.status !== "ACTIVE" || !key.scopes.includes("leads:ingest") || (key.expiresAt && key.expiresAt <= new Date())) {
      throw new ProblemException(HttpStatus.UNAUTHORIZED, "API_KEY_INVALID", "API key invalid", "The API key is invalid, expired or lacks leads:ingest scope");
    }
    request.workspace = { id: workspaceId, organizationId: key.workspace.organizationId, role: "AGENT" };
    request.idempotencyActorId = key.id;
    await this.prisma.workspaceApiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
    return true;
  }
}
