import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { leadCaptureInputSchema, type LeadCaptureInput } from "@repo/shared";
import { Public } from "../auth/public.decorator";
import { IdempotentCommand } from "../common/idempotency";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { LeadCommandService } from "./lead-command.service";
import { WorkspaceApiKeyGuard } from "./workspace-api-key.service";

@Controller("workspaces/:workspaceId/lead-ingestions")
export class LeadIngestionsController {
  constructor(private readonly commands: LeadCommandService) {}

  @Post()
  @Public()
  @UseGuards(WorkspaceApiKeyGuard)
  @IdempotentCommand()
  capture(@Req() request: Request & { workspace: { id: string }; idempotencyActorId: string }, @Body(new ZodValidationPipe(leadCaptureInputSchema)) input: LeadCaptureInput) {
    return this.commands.capture(request.workspace.id, input, {
      actorType: "SYSTEM",
      actorId: request.idempotencyActorId,
      correlationId: String(request.headers["x-correlation-id"]),
    });
  }
}
