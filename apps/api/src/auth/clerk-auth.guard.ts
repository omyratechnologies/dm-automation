import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { verifyToken } from "@clerk/backend";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { AuditService } from "../audit/audit.service";

export interface AuthedRequestUser {
  id: string;
  clerkId: string;
  email: string;
  role?: string;
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const header: string | undefined = req.headers["authorization"];
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }
    const token = header.slice("Bearer ".length);

    let claims: { sub: string; email?: string; role?: string };
    let verificationTimeout: ReturnType<typeof setTimeout> | undefined;
    try {
      claims = await Promise.race([
        verifyToken(token, {
          secretKey: this.config.getOrThrow<string>("CLERK_SECRET_KEY"),
        }),
        new Promise<never>((_, reject) =>
          {
            verificationTimeout = setTimeout(
              () => reject(new Error("Token verification timed out")),
              10_000,
            );
          },
        ),
      ]);
    } catch {
      throw new UnauthorizedException("Invalid token");
    } finally {
      if (verificationTimeout) clearTimeout(verificationTimeout);
    }

    const user = await this.prisma.user.findUnique({ where: { clerkId: claims.sub } });

    if (!user) {
      const canProvision =
        req.method === "POST" &&
        ["/v1/me", "/v1/me/ensure"].includes(req.path);
      const canReadEmptyProfile = req.method === "GET" && req.path === "/v1/me";
      if (!canProvision && !canReadEmptyProfile) {
        throw new UnauthorizedException({
          code: "USER_NOT_PROVISIONED",
          message: "User profile must be provisioned before this operation",
        });
      }
    }
    
    // Check for Impersonation Mode
    const impersonateUserId = req.headers["x-impersonate-user-id"];
    const isSuperAdmin = (claims.role === "SUPER_ADMIN" || (claims as any).metadata?.role === "SUPER_ADMIN");
    const isImpersonationEnabled = this.config.get<string>("SUPPORT_IMPERSONATION_ENABLED") === "true";

    if (isSuperAdmin && isImpersonationEnabled && typeof impersonateUserId === "string" && impersonateUserId.length > 0) {
      const targetUser = await this.prisma.user.findUnique({
        where: { id: impersonateUserId },
        include: {
          memberships: {
            select: {
              workspace: {
                select: { organizationId: true },
              },
            },
            take: 1,
          },
        },
      });

      if (targetUser) {
        const orgId = targetUser.memberships[0]?.workspace.organizationId;
        if (orgId && user) {
          await this.audit.log({
            organizationId: orgId,
            actorUserId: user.id,
            action: "admin.impersonate",
            targetType: "User",
            targetId: targetUser.id,
            meta: {
              adminEmail: user.email,
              targetEmail: targetUser.email,
            },
          });
        }

        req.user = {
          id: targetUser.id,
          clerkId: targetUser.clerkId,
          email: targetUser.email,
          role: "IMPERSONATED",
        } satisfies AuthedRequestUser;
        return true;
      }
    }

    req.user = {
      id: user?.id ?? randomUUID(),
      clerkId: claims.sub,
      email: user?.email ?? claims.email ?? "",
      role: claims.role || (claims as any).metadata?.role || "",
    } satisfies AuthedRequestUser;
    return true;
  }
}
