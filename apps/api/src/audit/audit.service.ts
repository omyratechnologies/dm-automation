import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface AuditEntry {
  organizationId: string;
  workspaceId?: string;
  actorUserId?: string;
  actorType?: "USER" | "SYSTEM";
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Fire-and-forget; audit failures never break the main operation. */
  log(entry: AuditEntry): void {
    void this.prisma.auditLog
      .create({
        data: {
          organizationId: entry.organizationId,
          workspaceId: entry.workspaceId,
          actorUserId: entry.actorUserId,
          actorType: entry.actorType ?? "USER",
          action: entry.action,
          targetType: entry.targetType,
          targetId: entry.targetId,
          meta: entry.meta,
        },
      })
      .catch((err) => this.logger.error(`audit write failed: ${err.message}`));
  }

  logAdminAction(
    adminUserId: string,
    action: string,
    targetType?: string,
    targetId?: string,
    meta?: Prisma.InputJsonValue,
    orgId?: string,
  ): void {
    if (!orgId) {
      this.logger.warn(`Admin action '${action}' logged without orgId`);
      return;
    }
    this.log({
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
