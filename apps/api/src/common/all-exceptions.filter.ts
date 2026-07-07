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
      response.status(status).json(exception.getResponse());
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
        error: error.message,
        stack: error.stack?.split("\n").slice(0, 8).join("\n"),
      },
      "Unhandled exception",
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
}
