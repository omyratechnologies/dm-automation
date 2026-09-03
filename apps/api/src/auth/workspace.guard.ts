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
import { ROLE_CAPABILITIES, type Capability, type Role } from "@repo/shared";
import { CAPABILITIES_KEY, WORKSPACE_SCOPED_KEY } from "./capabilities.decorator";

export interface WorkspaceContext {
  id: string;
  organizationId: string;
  role: Role;
  membershipId?: string;
}

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
    const workspaceScoped = this.reflector.getAllAndOverride<boolean>(WORKSPACE_SCOPED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!workspaceId) {
      if (workspaceScoped) {
        throw new ForbiddenException({
          code: "WORKSPACE_FORBIDDEN",
          detail: "Workspace context is required",
        });
      }
      return true;
    }

    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_workspaceId: { userId: req.user.id, workspaceId },
      },
      include: { workspace: { select: { organizationId: true } } },
    });
    if (!membership || membership.status !== "ACTIVE") {
      throw new ForbiddenException({
        code: "WORKSPACE_FORBIDDEN",
        detail: "You do not have access to this workspace",
      });
    }

    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (required?.length) {
      if (!required.includes(membership.role as Role)) {
        throw new ForbiddenException({ code: "WORKSPACE_FORBIDDEN", detail: "Insufficient role" });
      }
    }

    const requiredCapabilities = this.reflector.getAllAndOverride<Capability[]>(CAPABILITIES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredCapabilities?.length) {
      const granted = new Set(ROLE_CAPABILITIES[membership.role as Role]);
      if (!requiredCapabilities.every((capability) => granted.has(capability))) {
        throw new ForbiddenException({
          code: "WORKSPACE_FORBIDDEN",
          detail: "A required workspace capability is missing",
        });
      }
    }

    req.workspace = {
      id: workspaceId,
      organizationId: membership.workspace.organizationId,
      role: membership.role,
      membershipId: membership.id,
    } satisfies WorkspaceContext;
    return true;
  }
}
