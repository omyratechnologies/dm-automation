import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { QUEUES, WS_EVENTS } from "@repo/shared";
import type { SendMessageJob } from "@repo/shared";
import type { CONVERSATION_MODE, CONVERSATION_STATUS } from "@prisma/client";
import { InboxGateway } from "../inbox/inbox.gateway";
import { PrismaService } from "../prisma/prisma.service";

const CONVERSATIONS_PAGE_SIZE = 20;
const MESSAGES_PAGE_SIZE = 50;

export interface CreateAndQueueSendParams {
  workspaceId: string;
  igAccountId: string;
  contactId: string;
  conversationId: string;
  text: string;
  source: "FLOW" | "BROADCAST" | "AGENT" | "AI";
  sentById?: string;
  humanAgent?: boolean;
  quickReplies?: string[];
  broadcastId?: string;
  flowRunId?: string;
  replyToCommentId?: string;
}

export interface UpdateConversationInput {
  status?: CONVERSATION_STATUS;
  mode?: CONVERSATION_MODE;
  assignedToId?: string | null;
  markRead?: boolean;
}

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inbox: InboxGateway,
    @InjectQueue(QUEUES.SEND_MESSAGES)
    private readonly sendQueue: Queue<SendMessageJob>,
  ) {}

  /**
   * Creates a QUEUED outbound Message and enqueues the send job. This is the
   * only sanctioned way to send — the SendProcessor enforces windows/limits.
   */
  async createAndQueueSend(params: CreateAndQueueSendParams) {
    const message = await this.prisma.message.create({
      data: {
        workspaceId: params.workspaceId,
        conversationId: params.conversationId,
        direction: "OUT",
        source: params.source,
        text: params.text,
        status: "QUEUED",
        sentById: params.sentById ?? null,
      },
    });

    const job: SendMessageJob = {
      workspaceId: params.workspaceId,
      igAccountId: params.igAccountId,
      contactId: params.contactId,
      messageId: message.id,
      text: params.text,
      source: params.source,
      ...(params.quickReplies ? { quickReplies: params.quickReplies } : {}),
      ...(params.humanAgent !== undefined
        ? { humanAgent: params.humanAgent }
        : {}),
      ...(params.broadcastId ? { broadcastId: params.broadcastId } : {}),
      ...(params.flowRunId ? { flowRunId: params.flowRunId } : {}),
      ...(params.replyToCommentId
        ? { replyToCommentId: params.replyToCommentId }
        : {}),
    };
    await this.sendQueue.add("send", job);

    this.inbox.emitToWorkspace(
      params.workspaceId,
      WS_EVENTS.MESSAGE_CREATED,
      message,
    );
    return message;
  }

  async listConversations(
    workspaceId: string,
    query: { status?: CONVERSATION_STATUS; cursor?: string },
  ) {
    const items = await this.prisma.conversation.findMany({
      where: {
        workspaceId,
        ...(query.status ? { status: query.status } : {}),
      },
      include: {
        contact: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { lastMessageAt: "desc" },
      take: CONVERSATIONS_PAGE_SIZE + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > CONVERSATIONS_PAGE_SIZE;
    const page = hasMore ? items.slice(0, CONVERSATIONS_PAGE_SIZE) : items;
    return {
      items: page,
      nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    };
  }

  async listMessages(
    workspaceId: string,
    conversationId: string,
    query: { cursor?: string },
  ) {
    await this.getOwnedConversation(workspaceId, conversationId);

    const items = await this.prisma.message.findMany({
      where: { workspaceId, conversationId },
      orderBy: { createdAt: "desc" },
      take: MESSAGES_PAGE_SIZE + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > MESSAGES_PAGE_SIZE;
    const page = hasMore ? items.slice(0, MESSAGES_PAGE_SIZE) : items;
    return {
      items: page,
      nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    };
  }

  async updateConversation(
    workspaceId: string,
    conversationId: string,
    input: UpdateConversationInput,
  ) {
    await this.getOwnedConversation(workspaceId, conversationId);

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.mode !== undefined ? { mode: input.mode } : {}),
        ...(input.assignedToId !== undefined
          ? { assignedToId: input.assignedToId }
          : {}),
        ...(input.markRead ? { unreadCount: 0 } : {}),
      },
      include: { contact: true },
    });

    this.inbox.emitToWorkspace(
      workspaceId,
      WS_EVENTS.CONVERSATION_UPDATED,
      updated,
    );
    return updated;
  }

  async getOwnedConversation(workspaceId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, workspaceId },
    });
    if (!conversation) throw new NotFoundException("Conversation not found");
    return conversation;
  }
}
