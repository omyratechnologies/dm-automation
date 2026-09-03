import { Injectable, type NestMiddleware } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const incoming = request.header("x-correlation-id");
    const correlationId = incoming && incoming.length <= 128 ? incoming : randomUUID();
    request.headers["x-correlation-id"] = correlationId;
    response.setHeader("x-correlation-id", correlationId);
    next();
  }
}
