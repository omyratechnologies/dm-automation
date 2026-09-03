import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface AuditEntry {
  organizationId: string;
  workspaceId?: string;
  actorUserId?: string;
  actorType?: "USER" | "SYSTEM";
  source?: string;
  correlationId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Durable by default: callers can await the write and surface operational failure. */
  log(entry: AuditEntry): Promise<unknown> {
    return this.prisma.$transaction((tx) => this.logInTransaction(tx, entry));
  }

  async logInTransaction(tx: Prisma.TransactionClient, entry: AuditEntry): Promise<unknown> {
    const correlationId = entry.correlationId ?? randomUUID();
    const audit = await tx.auditLog.create({
      data: {
        organizationId: entry.organizationId,
        workspaceId: entry.workspaceId,
        actorUserId: entry.actorUserId,
        actorType: entry.actorType ?? "USER",
        source: entry.source ?? "APPLICATION",
        correlationId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        meta: this.safeMetadata(entry.meta),
      },
    });
    if (entry.workspaceId) {
      await tx.outboxEvent.create({
        data: {
          eventId: randomUUID(),
          type: "AuditRecorded",
          organizationId: entry.organizationId,
          workspaceId: entry.workspaceId,
          aggregateType: "AuditLog",
          aggregateId: audit.id,
          aggregateVersion: 1,
          actorType: "SYSTEM",
          actorId: entry.actorUserId,
          correlationId,
          payload: { auditId: audit.id, action: entry.action },
        },
      });
    }
    return audit;
  }

  private safeMetadata(value: Prisma.InputJsonValue | undefined): Prisma.InputJsonValue | undefined {
    if (value === undefined || value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map((item) => this.safeMetadata(item as Prisma.InputJsonValue) ?? null);
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key,
      /(token|secret|password|authorization|cookie|message|text|email|phone|transcript)/i.test(key)
        ? "[REDACTED]"
        : this.safeMetadata(item as Prisma.InputJsonValue) ?? null,
    ]));
  }

  logAdminAction(
    adminUserId: string,
    action: string,
    targetType?: string,
    targetId?: string,
    meta?: Prisma.InputJsonValue,
    orgId?: string,
  ): Promise<unknown> | void {
    if (!orgId) {
      this.logger.warn(`Admin action '${action}' logged without orgId`);
      return;
    }
    return this.log({
      organizationId: orgId,
      actorUserId: adminUserId,
      actorType: "USER",
      action: `admin.${action}`,
      targetType,
      targetId,
      meta,
    });
  }
}
