import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { CurrentWorkspace } from "../auth/decorators";
import { Roles } from "../auth/roles.decorator";
import type { WorkspaceContext } from "../auth/workspace.guard";

@ApiTags("audit")
@Controller("workspaces/:workspaceId/audit-logs")
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles("ADMIN")
  async list(
    @CurrentWorkspace() ws: WorkspaceContext,
    @Query("cursor") cursor?: string,
  ) {
    const take = 50;
    const logs = await this.prisma.auditLog.findMany({
      where: { workspaceId: ws.id },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const nextCursor = logs.length > take ? logs[take].id : null;
    return { items: logs.slice(0, take), nextCursor };
  }
}
