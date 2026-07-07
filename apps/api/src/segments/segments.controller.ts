import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { segmentFilterSchema } from "@repo/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { CurrentUser, CurrentWorkspace } from "../auth/decorators";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { SegmentsService } from "./segments.service";

const createSegmentSchema = z.object({
  name: z.string().min(1).max(100),
  filter: segmentFilterSchema,
});

const updateSegmentSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    filter: segmentFilterSchema.optional(),
  })
  .refine((v) => v.name !== undefined || v.filter !== undefined, {
    message: "At least one of name or filter is required",
  });

const previewQuerySchema = z.object({
  igAccountId: z.string().uuid().optional(),
});

@ApiTags("segments")
@ApiBearerAuth()
@Controller("workspaces/:workspaceId/segments")
export class SegmentsController {
  constructor(private readonly segments: SegmentsService) {}

  @Get()
  list(@CurrentWorkspace() ws: WorkspaceContext) {
    return this.segments.list(ws.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthedRequestUser,
    @CurrentWorkspace() ws: WorkspaceContext,
    @Body(new ZodValidationPipe(createSegmentSchema))
    body: z.infer<typeof createSegmentSchema>,
  ) {
    return this.segments.create(ws, user.id, body);
  }

  @Get(":id")
  get(@CurrentWorkspace() ws: WorkspaceContext, @Param("id") id: string) {
    return this.segments.get(ws.id, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthedRequestUser,
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSegmentSchema))
    body: z.infer<typeof updateSegmentSchema>,
  ) {
    return this.segments.update(ws, user.id, id, body);
  }

  @Delete(":id")
  remove(
    @CurrentUser() user: AuthedRequestUser,
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param("id") id: string,
  ) {
    return this.segments.remove(ws, user.id, id);
  }

  @Get(":id/preview")
  preview(
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param("id") id: string,
    @Query(new ZodValidationPipe(previewQuerySchema))
    query: z.infer<typeof previewQuerySchema>,
  ) {
    return this.segments.preview(ws.id, id, query.igAccountId ?? null);
  }
}
