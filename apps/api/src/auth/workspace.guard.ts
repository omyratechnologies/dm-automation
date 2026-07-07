import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../prisma/prisma.service";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { ROLES_KEY } from "./roles.decorator";
import type { Role } from "@repo/shared";

export interface WorkspaceContext {
  id: string;
  organizationId: string;
  role: Role;
}

const ROLE_RANK: Record<Role, number> = { OWNER: 3, ADMIN: 2, AGENT: 1 };

/**
 * Tenant boundary. Resolves the workspace from the x-workspace-id header (or
 * :workspaceId route param), verifies the authed user's membership, and
 * enforces any @Roles() requirement. Attaches req.workspace.
 */
@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    if (!req.user) return true; // ClerkAuthGuard already rejected or route is auth-only

    const workspaceId: string | undefined =
      req.params?.workspaceId ?? req.headers["x-workspace-id"];
    if (!workspaceId) {
      // Routes outside a workspace scope (e.g. org bootstrap) skip tenancy.
      return true;
    }

    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_workspaceId: { userId: req.user.id, workspaceId },
      },
      include: { workspace: { select: { organizationId: true } } },
    });
    if (!membership) {
      throw new ForbiddenException("Not a member of this workspace");
    }

    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (required?.length) {
      const min = Math.min(...required.map((r) => ROLE_RANK[r]));
      if (ROLE_RANK[membership.role as Role] < min) {
        throw new ForbiddenException("Insufficient role");
      }
    }

    req.workspace = {
      id: workspaceId,
      organizationId: membership.workspace.organizationId,
      role: membership.role,
    } satisfies WorkspaceContext;
    return true;
  }
}
