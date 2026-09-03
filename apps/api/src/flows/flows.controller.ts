import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpStatus,
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
import { RequireCapabilities, WorkspaceScoped } from "../auth/capabilities.decorator";
import { IdempotentCommand } from "../common/idempotency";
import { ProblemException } from "../common/problem-details";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { FlowsService } from "./flows.service";

const createFlowSchema = z.object({ name: z.string().min(1).max(100) });
type CreateFlowDto = z.infer<typeof createFlowSchema>;

const updateFlowSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
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

@Controller(["workspaces/:workspaceId/automations", "workspaces/:workspaceId/flows"])
@WorkspaceScoped()
export class FlowsController {
  constructor(private readonly flows: FlowsService) {}

  @Get()
  @RequireCapabilities("automations.read")
  list(@CurrentWorkspace() workspace: WorkspaceContext) {
    return this.flows.list(workspace.id);
  }

  @Post()
  @RequireCapabilities("automations.manage")
  @IdempotentCommand()
  create(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: AuthedRequestUser,
    @Body(new ZodValidationPipe(createFlowSchema)) body: CreateFlowDto,
  ) {
    return this.flows.create(workspace, user, body.name);
  }

  @Get(":id")
  @RequireCapabilities("automations.read")
  get(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param("id") id: string,
  ) {
    return this.flows.get(workspace.id, id);
  }

  @Patch(":id")
  @RequireCapabilities("automations.manage")
  @IdempotentCommand()
  update(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param("id") id: string,
    @Headers("if-match") ifMatch: string | undefined,
    @Body(new ZodValidationPipe(updateFlowSchema)) body: UpdateFlowDto,
  ) {
    return this.flows.update(workspace.id, id, this.version(ifMatch), body);
  }

  @Delete(":id")
  @Roles("ADMIN")
  @RequireCapabilities("automations.manage")
  @IdempotentCommand()
  remove(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: AuthedRequestUser,
    @Param("id") id: string,
    @Headers("if-match") ifMatch: string | undefined,
  ) {
    return this.flows.archive(workspace, user, id, this.version(ifMatch));
  }

  @Put(":id/draft")
  @RequireCapabilities("automations.manage")
  @IdempotentCommand()
  saveDraft(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param("id") id: string,
    @Headers("if-match") ifMatch: string | undefined,
    @Body(new ZodValidationPipe(saveDraftSchema)) body: SaveDraftDto,
  ) {
    return this.flows.saveDraft(workspace.id, id, this.version(ifMatch), body.definition);
  }

  @Post(":id/publish")
  @RequireCapabilities("automations.manage")
  @IdempotentCommand()
  publish(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: AuthedRequestUser,
    @Param("id") id: string,
    @Headers("if-match") ifMatch: string | undefined,
  ) {
    return this.flows.publish(workspace, user, id, this.version(ifMatch));
  }

  @Post(":id/pause") @RequireCapabilities("automations.manage") @IdempotentCommand()
  pause(@CurrentWorkspace() workspace: WorkspaceContext, @Param("id") id: string, @Headers("if-match") ifMatch?: string) { return this.flows.update(workspace.id, id, this.version(ifMatch), { status: "PAUSED" }); }

  @Post(":id/resume") @RequireCapabilities("automations.manage") @IdempotentCommand()
  resume(@CurrentWorkspace() workspace: WorkspaceContext, @Param("id") id: string, @Headers("if-match") ifMatch?: string) { return this.flows.update(workspace.id, id, this.version(ifMatch), { status: "ACTIVE" }); }

  @Post(":id/archive") @RequireCapabilities("automations.manage") @IdempotentCommand()
  archive(@CurrentWorkspace() workspace: WorkspaceContext, @CurrentUser() user: AuthedRequestUser, @Param("id") id: string, @Headers("if-match") ifMatch?: string) { return this.flows.archive(workspace, user, id, this.version(ifMatch)); }

  @Post(":id/simulations") @RequireCapabilities("automations.manage") @IdempotentCommand()
  simulate(@CurrentWorkspace() workspace: WorkspaceContext, @Param("id") id: string) { return this.flows.simulate(workspace.id, id); }

  @Get(":id/runs")
  @RequireCapabilities("automations.read")
  runs(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param("id") id: string,
    @Query("cursor") cursor?: string,
  ) {
    return this.flows.runs(workspace.id, id, cursor || undefined);
  }

  @Get(":id/runs/:runId") @RequireCapabilities("automations.read")
  run(@CurrentWorkspace() workspace: WorkspaceContext, @Param("id") id: string, @Param("runId") runId: string) { return this.flows.run(workspace.id, id, runId); }

  private version(value?: string): number {
    if (!value) throw new ProblemException(HttpStatus.PRECONDITION_REQUIRED, "PRECONDITION_REQUIRED", "Precondition required", "Provide If-Match with the current automation version");
    const version = Number(value.replace(/^W\//, "").replaceAll('"', ""));
    if (!Number.isInteger(version) || version < 1) throw new ProblemException(HttpStatus.BAD_REQUEST, "INVALID_IF_MATCH", "Invalid If-Match", "If-Match must contain a positive integer version");
    return version;
  }
}
