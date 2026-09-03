import { Body, Controller, Get, Headers, HttpStatus, Param, Post, Query } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { createHash, randomUUID, timingSafeEqual } from "crypto";
import { QUEUES, type GoogleSheetsJob } from "@repo/shared";
import { Public } from "../auth/public.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { CurrentWorkspace } from "../auth/decorators";
import { RequireCapabilities, WorkspaceScoped } from "../auth/capabilities.decorator";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { IdempotentCommand } from "../common/idempotency";
import { ProblemException } from "../common/problem-details";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SheetsService } from "./sheets.service";
import { createSheetDestinationSchema, CreateSheetDestinationDto, replaceSheetMappingsSchema, ReplaceSheetMappingsDto, resolveSheetConflictSchema, ResolveSheetConflictDto } from "./sheets.dto";
import { FeatureFlag } from "../common/feature-flag";

@Controller("workspaces/:workspaceId/sheets")
@WorkspaceScoped()
@FeatureFlag("FEATURE_GOOGLE_SHEETS")
export class SheetsController {
  constructor(private readonly sheets: SheetsService) {}

  @Get("destinations") @RequireCapabilities("sheets.read")
  list(@CurrentWorkspace() workspace: WorkspaceContext) { return this.sheets.list(workspace.id); }

  @Post("destinations") @RequireCapabilities("sheets.manage") @IdempotentCommand()
  create(@CurrentWorkspace() workspace: WorkspaceContext, @Body(new ZodValidationPipe(createSheetDestinationSchema)) input: CreateSheetDestinationDto) { return this.sheets.create(workspace.id, input); }

  @Post("destinations/:id/mappings") @RequireCapabilities("sheets.manage") @IdempotentCommand()
  mappings(@CurrentWorkspace() workspace: WorkspaceContext, @Param("id") id: string, @Headers("if-match") ifMatch: string | undefined, @Body(new ZodValidationPipe(replaceSheetMappingsSchema)) input: ReplaceSheetMappingsDto) { return this.sheets.replaceMappings(workspace.id, id, this.version(ifMatch), input); }

  @Get("destinations/:id/preview") @RequireCapabilities("sheets.read")
  preview(@CurrentWorkspace() workspace: WorkspaceContext, @Param("id") id: string) { return this.sheets.preview(workspace.id, id); }

  @Post("destinations/:id/activate") @RequireCapabilities("sheets.manage") @IdempotentCommand()
  activate(@CurrentWorkspace() workspace: WorkspaceContext, @Param("id") id: string, @Headers("if-match") ifMatch: string | undefined) { return this.sheets.activate(workspace.id, id, this.version(ifMatch)); }

  @Post("destinations/:id/test-row") @RequireCapabilities("sheets.manage") @IdempotentCommand()
  testRow(@CurrentWorkspace() workspace: WorkspaceContext, @Param("id") id: string) { return this.sheets.testRow(workspace.id, id); }

  @Post("destinations/:id/pause") @RequireCapabilities("sheets.manage") @IdempotentCommand()
  pause(@CurrentWorkspace() workspace: WorkspaceContext, @Param("id") id: string, @Headers("if-match") ifMatch: string | undefined) { return this.sheets.pause(workspace.id, id, this.version(ifMatch)); }

  @Post("destinations/:id/repair") @RequireCapabilities("sheets.manage") @IdempotentCommand()
  repair(@CurrentWorkspace() workspace: WorkspaceContext, @Param("id") id: string, @Headers("if-match") ifMatch: string | undefined) { return this.sheets.activate(workspace.id, id, this.version(ifMatch)); }

  @Get("destinations/:id/sync-runs") @RequireCapabilities("sheets.read")
  syncRuns(@CurrentWorkspace() workspace: WorkspaceContext, @Param("id") id: string, @Query("cursor") cursor?: string, @Query("limit") limit?: string) { return this.sheets.syncRuns(workspace.id, id, cursor, limit ? Number(limit) : 50); }

  @Get("conflicts") @RequireCapabilities("sheets.read")
  conflicts(@CurrentWorkspace() workspace: WorkspaceContext, @Query("cursor") cursor?: string, @Query("limit") limit?: string) { return this.sheets.conflicts(workspace.id, cursor, limit ? Number(limit) : 50); }

  @Post("conflicts/:id/resolve") @RequireCapabilities("sheets.manage") @IdempotentCommand()
  resolve(@CurrentWorkspace() workspace: WorkspaceContext, @Param("id") id: string, @Body(new ZodValidationPipe(resolveSheetConflictSchema)) input: ResolveSheetConflictDto) { return this.sheets.resolveConflict(workspace.id, id, input, workspace.membershipId!); }

  private version(value?: string): number {
    if (!value) throw new ProblemException(HttpStatus.PRECONDITION_REQUIRED, "PRECONDITION_REQUIRED", "Precondition required", "Provide If-Match with the current destination version");
    const version = Number(value.replace(/^W\//, "").replaceAll('"', ""));
    if (!Number.isInteger(version) || version < 1) throw new ProblemException(HttpStatus.BAD_REQUEST, "INVALID_IF_MATCH", "Invalid If-Match", "If-Match must contain a positive integer version");
    return version;
  }
}

@Controller("google/webhooks/drive")
@FeatureFlag("FEATURE_GOOGLE_SHEETS")
export class GoogleDriveWebhookController {
  constructor(private readonly prisma: PrismaService, @InjectQueue(QUEUES.GOOGLE_SHEETS) private readonly queue: Queue<GoogleSheetsJob>) {}

  @Post()
  @Public()
  async wake(
    @Headers("x-goog-channel-id") channelId?: string,
    @Headers("x-goog-channel-token") token?: string,
    @Headers("x-goog-message-number") messageNumber?: string,
  ) {
    if (!channelId || !token) return { accepted: false };
    const channel = await this.prisma.googleWatchChannel.findUnique({ where: { channelId } });
    const actual = createHash("sha256").update(token).digest();
    const expected = channel ? Buffer.from(channel.secretHash, "hex") : Buffer.alloc(32);
    if (!channel || actual.length !== expected.length || !timingSafeEqual(actual, expected) || channel.status !== "ACTIVE") return { accepted: false };
    const number = messageNumber ? BigInt(messageNumber) : BigInt(0);
    if (channel.messageNumber !== null && number <= channel.messageNumber) return { accepted: true, duplicate: true };
    await this.prisma.googleWatchChannel.update({ where: { id: channel.id }, data: { messageNumber: number } });
    await this.queue.add("drive-change", { eventId: randomUUID(), workspaceId: channel.workspaceId, destinationId: channel.id, operation: "DRAIN_CHANGES" }, { jobId: `google-sheets-drive:${channel.id}:${number}` });
    return { accepted: true };
  }
}
