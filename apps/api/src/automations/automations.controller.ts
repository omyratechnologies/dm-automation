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
import { z } from "zod";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import { CurrentUser, CurrentWorkspace } from "../auth/decorators";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AutomationsService } from "./automations.service";

const createAutomationSchema = z.object({
  id: z.string().uuid().optional(),
});
type CreateAutomationDto = z.infer<typeof createAutomationSchema>;

const updateAutomationSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    active: z.boolean().optional(),
  })
  .refine((v) => v.name !== undefined || v.active !== undefined, {
    message: "Provide name and/or active",
  });
type UpdateAutomationDto = z.infer<typeof updateAutomationSchema>;

const saveListenerSchema = z.object({
  listener: z.enum(["SMARTAI", "MESSAGE"]),
  prompt: z.string().min(1),
  reply: z.string().optional(),
});
type SaveListenerDto = z.infer<typeof saveListenerSchema>;

const saveTriggersSchema = z.object({
  triggers: z.array(z.string().min(1)).min(1).max(10),
});
type SaveTriggersDto = z.infer<typeof saveTriggersSchema>;

const addKeywordSchema = z.object({
  word: z.string().min(1).max(100),
});
type AddKeywordDto = z.infer<typeof addKeywordSchema>;

const savePostsSchema = z.object({
  posts: z
    .array(
      z.object({
        postid: z.string().min(1),
        caption: z.string().optional(),
        media: z.string().min(1),
        mediaType: z.enum(["IMAGE", "VIDEO", "CAROSEL_ALBUM"]),
        requireFollow: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(50),
});
type SavePostsDto = z.infer<typeof savePostsSchema>;

@Controller("workspaces/:workspaceId/automations")
export class AutomationsController {
  constructor(private readonly automations: AutomationsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthedRequestUser,
    @CurrentWorkspace() workspace: WorkspaceContext,
  ) {
    return this.automations.list(user.id, workspace);
  }

  @Post()
  create(
    @CurrentUser() user: AuthedRequestUser,
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Body(new ZodValidationPipe(createAutomationSchema)) body: CreateAutomationDto,
  ) {
    return this.automations.create(user.id, workspace, body.id);
  }

  @Get(":id")
  get(
    @CurrentUser() user: AuthedRequestUser,
    @Param("id") id: string,
  ) {
    return this.automations.get(user.id, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthedRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateAutomationSchema)) body: UpdateAutomationDto,
  ) {
    return this.automations.update(user.id, id, body);
  }

  @Delete(":id")
  remove(
    @CurrentUser() user: AuthedRequestUser,
    @Param("id") id: string,
  ) {
    return this.automations.remove(user.id, id);
  }

  @Post(":id/listener")
  saveListener(
    @CurrentUser() user: AuthedRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(saveListenerSchema)) body: SaveListenerDto,
  ) {
    return this.automations.saveListener(user.id, id, body);
  }

  @Post(":id/triggers")
  saveTriggers(
    @CurrentUser() user: AuthedRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(saveTriggersSchema)) body: SaveTriggersDto,
  ) {
    return this.automations.saveTriggers(user.id, id, body.triggers);
  }

  @Post(":id/keywords")
  addKeyword(
    @CurrentUser() user: AuthedRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(addKeywordSchema)) body: AddKeywordDto,
  ) {
    return this.automations.addKeyword(user.id, id, body.word);
  }

  @Delete("keywords/:keywordId")
  removeKeyword(
    @CurrentUser() user: AuthedRequestUser,
    @Param("keywordId") keywordId: string,
  ) {
    return this.automations.removeKeyword(user.id, keywordId);
  }

  @Post(":id/posts")
  savePosts(
    @CurrentUser() user: AuthedRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(savePostsSchema)) body: SavePostsDto,
  ) {
    return this.automations.savePosts(user.id, id, body.posts);
  }
}
