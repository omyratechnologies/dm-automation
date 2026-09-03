import { HttpException, HttpStatus } from "@nestjs/common";
import type { StableErrorCode } from "@repo/shared";

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: StableErrorCode | string;
  detail: string;
  correlationId?: string;
  errors?: Record<string, string[]>;
}

export class ProblemException extends HttpException {
  constructor(status: HttpStatus, code: StableErrorCode | string, title: string, detail: string) {
    super({
      type: `https://docs.gemai.app/problems/${code.toLowerCase().replaceAll("_", "-")}`,
      title,
      status,
      code,
      detail,
    } satisfies ProblemDetails, status);
  }
}
