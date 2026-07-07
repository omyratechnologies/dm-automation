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

export interface AuthedRequestUser {
  id: string;
  clerkId: string;
  email: string;
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
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
    const header: string | undefined = req.headers["authorization"];
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }
    const token = header.slice("Bearer ".length);

    let claims: { sub: string; email?: string };
    try {
      claims = await Promise.race([
        verifyToken(token, {
          secretKey: this.config.getOrThrow<string>("CLERK_SECRET_KEY"),
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Token verification timed out")), 10_000),
        ),
      ]);
    } catch {
      throw new UnauthorizedException("Invalid token");
    }

    const user = await this.prisma.user.findUnique({ where: { clerkId: claims.sub } });
    req.user = {
      id: user?.id ?? randomUUID(),
      clerkId: claims.sub,
      email: user?.email ?? claims.email ?? "",
    } satisfies AuthedRequestUser;
    return true;
  }
}
