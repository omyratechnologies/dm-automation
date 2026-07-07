import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { z } from "zod";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import { CurrentUser, CurrentWorkspace } from "../auth/decorators";
import { Roles } from "../auth/roles.decorator";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { FlowsService } from "./flows.service";

const createFlowSchema = z.object({ name: z.string().min(1).max(100) });
type CreateFlowDto = z.infer<typeof createFlowSchema>;

const updateFlowSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    status: z.enum(["ACTIVE", "PAUSED"]).optional(),
  })
  .refine((v) => v.name !== undefined || v.status !== undefined, {
    message: "Provide name and/or status",
  });
type UpdateFlowDto = z.infer<typeof updateFlowSchema>;

// Loose structural check only — WIP graphs are allowed; publish validates strictly.
const saveDraftSchema = z.object({
  definition: z.object({
    nodes: z.array(z.unknown()).max(100),
    edges: z.array(z.unknown()).max(200),
  }),
});
type SaveDraftDto = z.infer<typeof saveDraftSchema>;

@Controller("workspaces/:workspaceId/flows")
export class FlowsController {
  constructor(private readonly flows: FlowsService) {}

  @Get()
  list(@CurrentWorkspace() workspace: WorkspaceContext) {
    return this.flows.list(workspace.id);
  }

  @Post()
  create(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: AuthedRequestUser,
    @Body(new ZodValidationPipe(createFlowSchema)) body: CreateFlowDto,
  ) {
    return this.flows.create(workspace, user, body.name);
  }

  @Get(":id")
  get(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param("id") id: string,
  ) {
    return this.flows.get(workspace.id, id);
  }

  @Patch(":id")
  update(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateFlowSchema)) body: UpdateFlowDto,
  ) {
    return this.flows.update(workspace.id, id, body);
  }

  @Delete(":id")
  @Roles("ADMIN")
  remove(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: AuthedRequestUser,
    @Param("id") id: string,
  ) {
    return this.flows.remove(workspace, user, id);
  }

  @Put(":id/draft")
  saveDraft(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(saveDraftSchema)) body: SaveDraftDto,
  ) {
    return this.flows.saveDraft(workspace.id, id, body.definition);
  }

  @Post(":id/publish")
  publish(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: AuthedRequestUser,
    @Param("id") id: string,
  ) {
    return this.flows.publish(workspace, user, id);
  }

  @Get(":id/runs")
  runs(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param("id") id: string,
    @Query("cursor") cursor?: string,
  ) {
    return this.flows.runs(workspace.id, id, cursor || undefined);
  }
}
