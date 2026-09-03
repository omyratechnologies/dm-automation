import { Body, Controller, Delete, Get, Headers, HttpStatus, Param, Patch, Post, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import type { LEAD_STATUS } from "@prisma/client";
import { CurrentUser, CurrentWorkspace } from "../auth/decorators";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { RequireCapabilities, WorkspaceScoped } from "../auth/capabilities.decorator";
import { IdempotentCommand } from "../common/idempotency";
import { ProblemException } from "../common/problem-details";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { LeadCommandService } from "./lead-command.service";
import { LeadsService } from "./leads.service";
import {
  assignLeadSchema,
  AssignLeadDto,
  bulkLeadCommandSchema,
  BulkLeadCommandDto,
  createManualLeadSchema,
  CreateManualLeadDto,
  createPipelineSchema,
  CreatePipelineDto,
  createSavedViewSchema,
  CreateSavedViewDto,
  createStageSchema,
  CreateStageDto,
  createLeadFieldSchema,
  CreateLeadFieldDto,
  createTaskSchema,
  CreateTaskDto,
  mergeLeadSchema,
  MergeLeadDto,
  transitionLeadSchema,
  TransitionLeadDto,
  updateLeadSchema,
  UpdateLeadDto,
  updateLeadFieldValueSchema,
  UpdateLeadFieldValueDto,
  updateTaskSchema,
  UpdateTaskDto,
} from "./dto/leads.dto";
import { z } from "zod";
import { WorkspaceApiKeyService } from "./workspace-api-key.service";

const createApiKeySchema = z.object({ name: z.string().trim().min(1).max(120), expiresAt: z.string().datetime().optional() });

@Controller(["workspaces/:workspaceId/leads", "leads"])
@WorkspaceScoped()
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly commands: LeadCommandService,
  ) {}

  @Get()
  @RequireCapabilities("leads.read")
  getLeads(@CurrentWorkspace() workspace: WorkspaceContext, @Query("status") status?: LEAD_STATUS, @Query("cursor") cursor?: string, @Query("limit") limit?: string, @Query("search") search?: string, @Query("pipelineId") pipelineId?: string, @Query("view") view?: string) {
    return this.leadsService.listLeads(workspace.id, { status, cursor, limit: limit ? Number(limit) : 50, search, pipelineId, needsAttention: view === "needs-attention" });
  }

  @Post()
  @RequireCapabilities("leads.write")
  @IdempotentCommand()
  createManual(@CurrentWorkspace() workspace: WorkspaceContext, @CurrentUser() user: AuthedRequestUser, @Req() request: Request, @Body(new ZodValidationPipe(createManualLeadSchema)) dto: CreateManualLeadDto) {
    return this.commands.capture(workspace.id, { ...dto, source: "MANUAL" }, this.actor(user, workspace, request));
  }

  @Post("bulk-commands")
  @RequireCapabilities("leads.write")
  @IdempotentCommand()
  bulk(@CurrentWorkspace() workspace: WorkspaceContext, @CurrentUser() user: AuthedRequestUser, @Req() request: Request, @Body(new ZodValidationPipe(bulkLeadCommandSchema)) dto: BulkLeadCommandDto) {
    return this.commands.bulk(workspace.id, dto, this.actor(user, workspace, request));
  }

  @Get("saved-views")
  @RequireCapabilities("leads.read")
  savedViews(@CurrentWorkspace() workspace: WorkspaceContext, @CurrentUser() user: AuthedRequestUser) {
    return this.leadsService.listSavedViews(workspace.id, user.id);
  }

  @Post("saved-views")
  @RequireCapabilities("leads.write")
  @IdempotentCommand()
  createSavedView(@CurrentWorkspace() workspace: WorkspaceContext, @CurrentUser() user: AuthedRequestUser, @Body(new ZodValidationPipe(createSavedViewSchema)) dto: CreateSavedViewDto) {
    return this.leadsService.createSavedView(workspace.id, user.id, dto);
  }

  @Delete("saved-views/:viewId")
  @RequireCapabilities("leads.write")
  @IdempotentCommand()
  deleteSavedView(@CurrentWorkspace() workspace: WorkspaceContext, @CurrentUser() user: AuthedRequestUser, @Param("viewId") viewId: string) {
    return this.leadsService.deleteSavedView(workspace.id, user.id, viewId);
  }

  @Get(":id")
  @RequireCapabilities("leads.read")
  getLead(@Param("id") leadId: string, @CurrentWorkspace() workspace: WorkspaceContext) {
    return this.leadsService.getLead(workspace.id, leadId);
  }

  @Patch(":id")
  @RequireCapabilities("leads.write")
  @IdempotentCommand()
  updateLead(@Param("id") leadId: string, @CurrentWorkspace() workspace: WorkspaceContext, @CurrentUser() user: AuthedRequestUser, @Headers("if-match") ifMatch: string | undefined, @Req() request: Request, @Body(new ZodValidationPipe(updateLeadSchema)) dto: UpdateLeadDto) {
    return this.commands.update(workspace.id, leadId, this.expectedVersion(ifMatch), dto, this.actor(user, workspace, request));
  }

  @Post(":id/stage-transitions")
  @RequireCapabilities("leads.write")
  @IdempotentCommand()
  transition(@Param("id") leadId: string, @CurrentWorkspace() workspace: WorkspaceContext, @CurrentUser() user: AuthedRequestUser, @Headers("if-match") ifMatch: string | undefined, @Req() request: Request, @Body(new ZodValidationPipe(transitionLeadSchema)) dto: TransitionLeadDto) {
    return this.commands.transition(workspace.id, leadId, this.expectedVersion(ifMatch), dto, this.actor(user, workspace, request));
  }

  @Post(":id/assignment")
  @RequireCapabilities("leads.assign")
  @IdempotentCommand()
  assign(@Param("id") leadId: string, @CurrentWorkspace() workspace: WorkspaceContext, @CurrentUser() user: AuthedRequestUser, @Headers("if-match") ifMatch: string | undefined, @Req() request: Request, @Body(new ZodValidationPipe(assignLeadSchema)) dto: AssignLeadDto) {
    return this.commands.assign(workspace.id, leadId, this.expectedVersion(ifMatch), dto, this.actor(user, workspace, request));
  }

  @Post(":id/archive")
  @RequireCapabilities("leads.write")
  @IdempotentCommand()
  archive(@Param("id") leadId: string, @CurrentWorkspace() workspace: WorkspaceContext, @CurrentUser() user: AuthedRequestUser, @Headers("if-match") ifMatch: string | undefined, @Req() request: Request) {
    return this.commands.archive(workspace.id, leadId, this.expectedVersion(ifMatch), true, this.actor(user, workspace, request));
  }

  @Post(":id/restore")
  @RequireCapabilities("leads.write")
  @IdempotentCommand()
  restore(@Param("id") leadId: string, @CurrentWorkspace() workspace: WorkspaceContext, @CurrentUser() user: AuthedRequestUser, @Headers("if-match") ifMatch: string | undefined, @Req() request: Request) {
    return this.commands.archive(workspace.id, leadId, this.expectedVersion(ifMatch), false, this.actor(user, workspace, request));
  }

  @Post(":id/tasks")
  @RequireCapabilities("leads.write")
  @IdempotentCommand()
  createTask(@Param("id") leadId: string, @CurrentWorkspace() workspace: WorkspaceContext, @CurrentUser() user: AuthedRequestUser, @Req() request: Request, @Body(new ZodValidationPipe(createTaskSchema)) dto: CreateTaskDto) {
    return this.commands.createTask(workspace.id, leadId, dto, this.actor(user, workspace, request));
  }

  @Patch(":id/tasks/:taskId")
  @RequireCapabilities("leads.write")
  @IdempotentCommand()
  updateTask(@Param("id") leadId: string, @Param("taskId") taskId: string, @CurrentWorkspace() workspace: WorkspaceContext, @CurrentUser() user: AuthedRequestUser, @Headers("if-match") ifMatch: string | undefined, @Req() request: Request, @Body(new ZodValidationPipe(updateTaskSchema)) dto: UpdateTaskDto) {
    return this.commands.updateTask(workspace.id, leadId, taskId, this.expectedVersion(ifMatch), dto, this.actor(user, workspace, request));
  }

  @Post(":id/merge")
  @RequireCapabilities("leads.write")
  @IdempotentCommand()
  merge(@Param("id") leadId: string, @CurrentWorkspace() workspace: WorkspaceContext, @CurrentUser() user: AuthedRequestUser, @Headers("if-match") ifMatch: string | undefined, @Req() request: Request, @Body(new ZodValidationPipe(mergeLeadSchema)) dto: MergeLeadDto) {
    return this.commands.merge(workspace.id, leadId, this.expectedVersion(ifMatch), dto, this.actor(user, workspace, request));
  }

  @Get("configuration/fields")
  @RequireCapabilities("leads.read")
  getLeadFields(@CurrentWorkspace() workspace: WorkspaceContext) {
    return this.leadsService.listLeadFields(workspace.id);
  }

  @Post("configuration/fields")
  @RequireCapabilities("pipelines.manage")
  @IdempotentCommand()
  createLeadField(@CurrentWorkspace() workspace: WorkspaceContext, @Body(new ZodValidationPipe(createLeadFieldSchema)) dto: CreateLeadFieldDto) {
    return this.leadsService.createLeadField(workspace.id, dto);
  }

  /** One-release legacy adapter. */
  @Post("values/:contactId")
  @RequireCapabilities("leads.write")
  @IdempotentCommand()
  updateFieldValue(@Param("contactId") contactId: string, @CurrentWorkspace() workspace: WorkspaceContext, @Body(new ZodValidationPipe(updateLeadFieldValueSchema)) dto: UpdateLeadFieldValueDto) {
    return this.leadsService.saveLeadFieldValue(contactId, workspace.id, dto);
  }

  private expectedVersion(ifMatch?: string): number {
    if (!ifMatch) throw new ProblemException(HttpStatus.PRECONDITION_REQUIRED, "PRECONDITION_REQUIRED", "Precondition required", "Provide If-Match with the current lead version");
    const version = Number(ifMatch.replace(/^W\//, "").replaceAll('"', ""));
    if (!Number.isInteger(version) || version < 1) throw new ProblemException(HttpStatus.BAD_REQUEST, "INVALID_IF_MATCH", "Invalid If-Match", "If-Match must contain a positive integer version");
    return version;
  }

  private actor(user: AuthedRequestUser, workspace: WorkspaceContext, request: Request) {
    return { actorType: "USER" as const, actorId: user.id, membershipId: workspace.membershipId, correlationId: String(request.headers["x-correlation-id"]) };
  }
}

@Controller(["workspaces/:workspaceId/pipelines", "pipelines"])
@WorkspaceScoped()
export class LeadPipelinesController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  @RequireCapabilities("leads.read")
  list(@CurrentWorkspace() workspace: WorkspaceContext) {
    return this.leads.listPipelines(workspace.id);
  }

  @Post()
  @RequireCapabilities("pipelines.manage")
  @IdempotentCommand()
  create(@CurrentWorkspace() workspace: WorkspaceContext, @Body(new ZodValidationPipe(createPipelineSchema)) input: CreatePipelineDto) {
    return this.leads.createPipeline(workspace.id, input);
  }

  @Post(":pipelineId/stages")
  @RequireCapabilities("pipelines.manage")
  @IdempotentCommand()
  createStage(@CurrentWorkspace() workspace: WorkspaceContext, @Param("pipelineId") pipelineId: string, @Body(new ZodValidationPipe(createStageSchema)) input: CreateStageDto) {
    return this.leads.createStage(workspace.id, pipelineId, input);
  }

  @Post(":pipelineId/activate")
  @RequireCapabilities("pipelines.manage")
  @IdempotentCommand()
  activate(@CurrentWorkspace() workspace: WorkspaceContext, @Param("pipelineId") pipelineId: string, @Headers("if-match") ifMatch?: string) {
    return this.leads.setPipelineStatus(workspace.id, pipelineId, this.expectedVersion(ifMatch), "ACTIVE");
  }

  @Post(":pipelineId/archive")
  @RequireCapabilities("pipelines.manage")
  @IdempotentCommand()
  archive(@CurrentWorkspace() workspace: WorkspaceContext, @Param("pipelineId") pipelineId: string, @Headers("if-match") ifMatch?: string) {
    return this.leads.setPipelineStatus(workspace.id, pipelineId, this.expectedVersion(ifMatch), "ARCHIVED");
  }

  private expectedVersion(ifMatch?: string): number {
    if (!ifMatch) throw new ProblemException(HttpStatus.PRECONDITION_REQUIRED, "PRECONDITION_REQUIRED", "Precondition required", "Provide If-Match with the current pipeline version");
    const version = Number(ifMatch.replace(/^W\//, "").replaceAll('"', ""));
    if (!Number.isInteger(version) || version < 1) throw new ProblemException(HttpStatus.BAD_REQUEST, "INVALID_IF_MATCH", "Invalid If-Match", "If-Match must contain a positive integer version");
    return version;
  }
}

@Controller("workspaces/:workspaceId/api-keys")
@WorkspaceScoped()
export class WorkspaceApiKeysController {
  constructor(private readonly apiKeys: WorkspaceApiKeyService) {}

  @Post()
  @RequireCapabilities("integrations.manage")
  @IdempotentCommand()
  create(@CurrentWorkspace() workspace: WorkspaceContext, @Body(new ZodValidationPipe(createApiKeySchema)) input: z.infer<typeof createApiKeySchema>) {
    return this.apiKeys.create(workspace.id, workspace.membershipId!, input.name, input.expiresAt ? new Date(input.expiresAt) : undefined);
  }

  @Post(":id/revoke")
  @RequireCapabilities("integrations.manage")
  @IdempotentCommand()
  revoke(@CurrentWorkspace() workspace: WorkspaceContext, @Param("id") id: string) {
    return this.apiKeys.revoke(workspace.id, id);
  }
}
