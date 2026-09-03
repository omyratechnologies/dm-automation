import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from "@nestjs/common";
import { createHash } from "crypto";
import type { Request, Response } from "express";
import { lastValueFrom, of } from "rxjs";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../prisma/prisma.service";
import { ProblemException } from "./problem-details";
import { Prisma } from "@prisma/client";

export const IDEMPOTENT_KEY = "idempotent_command";
export const IdempotentCommand = () => SetMetadata(IDEMPOTENT_KEY, true);

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService, private readonly reflector: Reflector) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const required = this.reflector.getAllAndOverride<boolean>(IDEMPOTENT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return next.handle();

    const request = context.switchToHttp().getRequest<Request & {
      user?: { id: string };
      workspace?: { id: string };
      idempotencyActorId?: string;
    }>();
    const response = context.switchToHttp().getResponse<Response>();
    const key = request.header("idempotency-key")?.trim();
    if (!key || key.length > 200) {
      throw new ProblemException(
        HttpStatus.BAD_REQUEST,
        "IDEMPOTENCY_KEY_REQUIRED",
        "Idempotency key required",
        "Provide a valid Idempotency-Key header for this command",
      );
    }
    const actorId = request.user?.id ?? request.idempotencyActorId;
    if (!request.workspace?.id || !actorId) {
      throw new ProblemException(HttpStatus.FORBIDDEN, "WORKSPACE_FORBIDDEN", "Workspace required", "Idempotent workspace commands require an authenticated workspace context");
    }

    const route = `${request.method}:${request.route?.path ?? request.path}`;
    const requestHash = createHash("sha256")
      .update(JSON.stringify({ params: request.params, query: request.query, body: request.body }))
      .digest("hex");
    const identity = {
      workspaceId: request.workspace.id,
      actorId,
      route,
      key,
    };

    let ownsRecord = false;
    try {
      await this.prisma.idempotencyRecord.create({
        data: {
          ...identity,
          requestHash,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      ownsRecord = true;
    } catch (error) {
      if ((error as { code?: string }).code !== "P2002") throw error;
      const existing = await this.prisma.idempotencyRecord.findUnique({
        where: { workspaceId_actorId_route_key: identity },
      });
      if (!existing || existing.requestHash !== requestHash) {
        throw new ProblemException(HttpStatus.CONFLICT, "IDEMPOTENCY_KEY_REUSED", "Idempotency key reused", "This key was already used for a different request");
      }
      if (existing.status === "COMPLETED") {
        response.status(existing.responseStatus ?? HttpStatus.OK);
        return of(existing.responseBody);
      }
      const staleBefore = new Date(Date.now() - 5 * 60 * 1000);
      if (existing.status === "FAILED" || existing.updatedAt < staleBefore) {
        const reclaimed = await this.prisma.idempotencyRecord.updateMany({
          where: {
            ...identity,
            requestHash,
            ...(existing.status === "FAILED"
              ? { status: "FAILED" }
              : { status: "IN_PROGRESS", updatedAt: { lt: staleBefore } }),
          },
          data: {
            status: "IN_PROGRESS",
            responseStatus: null,
            responseBody: Prisma.JsonNull,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
        ownsRecord = reclaimed.count === 1;
      }
      if (!ownsRecord) {
        response.setHeader("Retry-After", "2");
        throw new ProblemException(HttpStatus.CONFLICT, "IDEMPOTENCY_REQUEST_IN_PROGRESS", "Request in progress", "A request with this idempotency key is still being processed");
      }
    }

    try {
      const body = await lastValueFrom(next.handle() as any);
      await this.prisma.idempotencyRecord.update({
        where: { workspaceId_actorId_route_key: identity },
        data: {
          status: "COMPLETED",
          responseStatus: response.statusCode,
          responseBody: body === undefined || body === null ? Prisma.JsonNull : body,
        },
      });
      return of(body);
    } catch (error) {
      await this.prisma.idempotencyRecord.update({
        where: { workspaceId_actorId_route_key: identity },
        data: { status: "FAILED" },
      });
      throw error;
    }
  }
}
