import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { maxBytesRefine, maxBytesMessage } from "@repo/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { CurrentUser, CurrentWorkspace } from "../auth/decorators";
import { Roles } from "../auth/roles.decorator";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { BroadcastsService } from "./broadcasts.service";
import { RequireCapabilities, WorkspaceScoped } from "../auth/capabilities.decorator";
import { IdempotentCommand } from "../common/idempotency";

const createBroadcastSchema = z.object({
  name: z.string().min(1).max(100),
  igAccountId: z.string().uuid(),
  segmentId: z.string().uuid().nullish(),
  messageText: z.string().min(1).refine(maxBytesRefine(1000), maxBytesMessage(1000)),
});

const updateBroadcastSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    igAccountId: z.string().uuid().optional(),
    segmentId: z.string().uuid().nullable().optional(),
    messageText: z.string().min(1).refine(maxBytesRefine(1000), maxBytesMessage(1000)).optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "At least one field is required",
  });

@ApiTags("broadcasts")
@ApiBearerAuth()
@Controller("workspaces/:workspaceId/broadcasts")
@WorkspaceScoped()
export class BroadcastsController {
  constructor(private readonly broadcasts: BroadcastsService) {}

  @Get()
  @RequireCapabilities("automations.read")
  list(@CurrentWorkspace() ws: WorkspaceContext) {
    return this.broadcasts.list(ws.id);
  }

  @Post()
  @RequireCapabilities("automations.manage")
  @IdempotentCommand()
  create(
    @CurrentUser() user: AuthedRequestUser,
    @CurrentWorkspace() ws: WorkspaceContext,
    @Body(new ZodValidationPipe(createBroadcastSchema))
    body: z.infer<typeof createBroadcastSchema>,
  ) {
    return this.broadcasts.create(ws, user.id, {
      name: body.name,
      igAccountId: body.igAccountId,
      segmentId: body.segmentId ?? null,
      messageText: body.messageText,
    });
  }

  @Get(":id")
  @RequireCapabilities("automations.read")
  get(@CurrentWorkspace() ws: WorkspaceContext, @Param("id") id: string) {
    return this.broadcasts.get(ws.id, id);
  }

  @Patch(":id")
  @RequireCapabilities("automations.manage")
  @IdempotentCommand()
  update(
    @CurrentUser() user: AuthedRequestUser,
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateBroadcastSchema))
    body: z.infer<typeof updateBroadcastSchema>,
  ) {
    return this.broadcasts.update(ws, user.id, id, body);
  }

  @Post(":id/send")
  @Roles("ADMIN")
  @RequireCapabilities("automations.manage")
  @IdempotentCommand()
  send(
    @CurrentUser() user: AuthedRequestUser,
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param("id") id: string,
  ) {
    return this.broadcasts.send(ws, user.id, id);
  }

  @Post(":id/cancel")
  @RequireCapabilities("automations.manage")
  @IdempotentCommand()
  cancel(
    @CurrentUser() user: AuthedRequestUser,
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param("id") id: string,
  ) {
    return this.broadcasts.cancel(ws, user.id, id);
  }
}
