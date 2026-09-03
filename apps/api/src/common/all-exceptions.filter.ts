import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { inspect } from "util";
import { randomUUID } from "crypto";

/**
 * Catches every unhandled exception that isn't already an HttpException.
 * Logs the full error with request context and returns a safe 500 response
 * without exposing stack traces.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const correlationId = this.correlationId(request);
      const body = exception.getResponse();
      const source = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
      const detail = typeof body === "string"
        ? body
        : typeof source.detail === "string"
          ? source.detail
          : Array.isArray(source.message)
            ? "Request validation failed"
            : typeof source.message === "string" ? source.message : exception.message;
      response
        .status(status)
        .type("application/problem+json")
        .json({
          type: source.type ?? "about:blank",
          title: source.title ?? this.statusTitle(status),
          status,
          code: source.code ?? this.defaultCode(status),
          detail,
          correlationId,
          ...(source.errors && typeof source.errors === "object" ? { errors: source.errors } : Array.isArray(source.message) ? { errors: { body: source.message } } : {}),
        });
      return;
    }

    const error =
      exception instanceof Error
        ? exception
        : new Error(`Non-Error thrown: ${inspect(exception)}`);

    this.logger.error(
      {
        method: request.method,
        path: request.path,
        userId: ((request as unknown as Record<string, unknown>).user as Record<string, unknown> | undefined)?.id ?? "unauthenticated",
        workspaceId: request.headers["x-workspace-id"] ?? "none",
        errorName: error.name,
        errorCode: (error as Error & { code?: string }).code ?? "UNKNOWN",
        stack: error.stack?.split("\n").slice(0, 8).join("\n"),
      },
      "Unhandled exception",
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).type("application/problem+json").json({
      type: "about:blank",
      title: "Internal Server Error",
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: "INTERNAL_ERROR",
      detail: "An unexpected error occurred",
      correlationId: this.correlationId(request),
    });
  }

  private correlationId(request: Request): string {
    const existing = request.headers["x-correlation-id"];
    return typeof existing === "string" && existing.length <= 128 ? existing : randomUUID();
  }

  private statusTitle(status: number): string {
    return HttpStatus[status]?.replaceAll("_", " ") ?? "Request Failed";
  }

  private defaultCode(status: number): string {
    if (status === 403) return "WORKSPACE_FORBIDDEN";
    if (status === 412) return "VERSION_CONFLICT";
    if (status === 428) return "PRECONDITION_REQUIRED";
    return `HTTP_${status}`;
  }
}
