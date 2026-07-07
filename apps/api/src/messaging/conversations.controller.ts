import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { z } from "zod";
import { AuditService } from "../audit/audit.service";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import { CurrentUser, CurrentWorkspace } from "../auth/decorators";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { MessagingService } from "./messaging.service";

const listConversationsQuery = z.object({
  status: z.enum(["OPEN", "CLOSED"]).optional(),
  cursor: z.string().uuid().optional(),
});
type ListConversationsQuery = z.infer<typeof listConversationsQuery>;

const listMessagesQuery = z.object({
  cursor: z.string().uuid().optional(),
});
type ListMessagesQuery = z.infer<typeof listMessagesQuery>;

const updateConversationSchema = z.object({
  status: z.enum(["OPEN", "CLOSED"]).optional(),
  mode: z.enum(["BOT", "HUMAN"]).optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  markRead: z.boolean().optional(),
});
type UpdateConversationDto = z.infer<typeof updateConversationSchema>;

const sendMessageSchema = z.object({
  text: z.string().min(1).max(1000),
});
type SendMessageDto = z.infer<typeof sendMessageSchema>;

@Controller("workspaces/:workspaceId/conversations")
export class ConversationsController {
  constructor(
    private readonly messaging: MessagingService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Query(new ZodValidationPipe(listConversationsQuery))
    query: ListConversationsQuery,
  ) {
    return this.messaging.listConversations(workspace.id, query);
  }

  @Get(":id/messages")
  listMessages(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param("id") id: string,
    @Query(new ZodValidationPipe(listMessagesQuery)) query: ListMessagesQuery,
  ) {
    return this.messaging.listMessages(workspace.id, id, query);
  }

  @Patch(":id")
  async update(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: AuthedRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateConversationSchema))
    body: UpdateConversationDto,
  ) {
    const updated = await this.messaging.updateConversation(
      workspace.id,
      id,
      body,
    );
    this.audit.log({
      organizationId: workspace.organizationId,
      workspaceId: workspace.id,
      actorUserId: user.id,
      action: "conversation.updated",
      targetType: "Conversation",
      targetId: id,
      meta: body,
    });
    return updated;
  }

  @Post(":id/messages")
  async sendMessage(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: AuthedRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(sendMessageSchema)) body: SendMessageDto,
  ) {
    const conversation = await this.messaging.getOwnedConversation(
      workspace.id,
      id,
    );
    return this.messaging.createAndQueueSend({
      workspaceId: workspace.id,
      igAccountId: conversation.igAccountId,
      contactId: conversation.contactId,
      conversationId: conversation.id,
      text: body.text,
      source: "AGENT",
      sentById: user.id,
      humanAgent: true,
    });
  }
}
