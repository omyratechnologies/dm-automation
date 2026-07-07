import { Logger } from "@nestjs/common";
import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job, Queue } from "bullmq";
import { QUEUES, WS_EVENTS } from "@repo/shared";
import type { FlowRunJob, WebhookEventJob } from "@repo/shared";
import type { IgAccount } from "@prisma/client";
import { TokenCrypto } from "../common/crypto/kms";
import { InboxGateway } from "../inbox/inbox.gateway";
import { IgGraphClient } from "../instagram/ig-graph.client";
import { PrismaService } from "../prisma/prisma.service";

type TriggerSource = "dm" | "comment" | "story_reply";

interface InboundInput {
  senderIgUserId: string;
  username?: string;
  text: string;
  mid?: string;
  source: TriggerSource;
  postId?: string;
  commentId?: string;
}

interface IgMessagingItem {
  sender?: { id?: unknown };
  message?: {
    mid?: unknown;
    text?: unknown;
    is_echo?: unknown;
    reply_to?: { story?: unknown };
    attachments?: Array<{ type?: unknown } | null>;
  };
}

interface IgChangeItem {
  field?: unknown;
  value?: {
    id?: unknown;
    text?: unknown;
    from?: { id?: unknown; username?: unknown };
    media?: { id?: unknown };
  };
}

interface IgEntry {
  id?: unknown;
  messaging?: Array<IgMessagingItem | null>;
  changes?: Array<IgChangeItem | null>;
}

/**
 * Async webhook pipeline: resolves the IG account, upserts contact +
 * conversation, records the inbound message, kicks off flow triggers (BOT
 * mode only) and pushes realtime inbox updates.
 */
@Processor(QUEUES.WEBHOOK_EVENTS, { concurrency: 5 })
export class WebhookEventsProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookEventsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inbox: InboxGateway,
    private readonly graph: IgGraphClient,
    private readonly tokenCrypto: TokenCrypto,
    @InjectQueue(QUEUES.FLOW_RUNS)
    private readonly flowQueue: Queue<FlowRunJob>,
  ) {
    super();
  }

  async process(job: Job<WebhookEventJob>): Promise<void> {
    const event = await this.prisma.webhookEvent.findUnique({
      where: { id: job.data.webhookEventId },
    });
    if (!event || event.status !== "RECEIVED") return;

    try {
      await this.handleEntry(event.payload as IgEntry | null);
      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: { status: "PROCESSED", processedAt: new Date(), error: null },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Webhook event ${event.id} failed: ${message}`);
      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: { status: "FAILED", processedAt: new Date(), error: message },
      });
    }
  }

  private async handleEntry(entry: IgEntry | null): Promise<void> {
    const igUserId = entry?.id !== undefined ? String(entry.id) : "";
    if (!igUserId) return;

    const igAccount = await this.prisma.igAccount.findUnique({
      where: { igUserId },
    });
    if (!igAccount || igAccount.status === "DISCONNECTED") return;

    for (const item of entry?.messaging ?? []) {
      if (item) await this.handleMessaging(igAccount, item);
    }
    for (const change of entry?.changes ?? []) {
      if (change?.field === "comments" && change.value) {
        await this.handleComment(igAccount, change.value);
      }
    }
  }

  private async handleMessaging(
    igAccount: IgAccount,
    item: IgMessagingItem,
  ): Promise<void> {
    const message = item.message;
    if (!message || message.is_echo) return;

    const senderId =
      item.sender?.id !== undefined ? String(item.sender.id) : "";
    if (!senderId || senderId === igAccount.igUserId) return;

    const isStoryReply =
      Boolean(message.reply_to?.story) ||
      (Array.isArray(message.attachments) &&
        message.attachments.some((a) => a?.type === "story_mention"));

    await this.ingestInbound(igAccount, {
      senderIgUserId: senderId,
      text: typeof message.text === "string" ? message.text : "",
      mid: typeof message.mid === "string" ? message.mid : undefined,
      source: isStoryReply ? "story_reply" : "dm",
    });
  }

  private async handleComment(
    igAccount: IgAccount,
    value: NonNullable<IgChangeItem["value"]>,
  ): Promise<void> {
    const fromId =
      value.from?.id !== undefined ? String(value.from.id) : "";
    if (!fromId || fromId === igAccount.igUserId) return;

    await this.ingestInbound(igAccount, {
      senderIgUserId: fromId,
      username:
        typeof value.from?.username === "string"
          ? value.from.username
          : undefined,
      text: typeof value.text === "string" ? value.text : "",
      source: "comment",
      postId: value.media?.id !== undefined ? String(value.media.id) : undefined,
      commentId: value.id !== undefined ? String(value.id) : undefined,
    });
  }

  private async ingestInbound(
    igAccount: IgAccount,
    input: InboundInput,
  ): Promise<void> {
    const now = new Date();

    const contact = await this.prisma.contact.upsert({
      where: {
        igAccountId_igUserId: {
          igAccountId: igAccount.id,
          igUserId: input.senderIgUserId,
        },
      },
      create: {
        workspaceId: igAccount.workspaceId,
        igAccountId: igAccount.id,
        igUserId: input.senderIgUserId,
        username: input.username ?? null,
        lastInboundAt: now,
      },
      update: {
        lastInboundAt: now,
        ...(input.username ? { username: input.username } : {}),
      },
    });

    // Check & cache follow status on every inbound message
    const isFollow = await this.lookupFollowStatus(igAccount, input.senderIgUserId);
    if (contact.isFollow !== isFollow) {
      await this.prisma.contact.update({
        where: { id: contact.id },
        data: { isFollow },
      });
    }

    // Post-centric follow gate: skip flow if the post requires follow
    // and the sender doesn't follow the business account.
    if (
      input.source === "comment" &&
      input.postId &&
      !isFollow &&
      (await this.postRequiresFollow(input.postId))
    ) {
      this.logger.debug(
        `Comment gate: ${input.senderIgUserId} does not follow ${igAccount.igUserId} on post ${input.postId}`,
      );
      return;
    }

    const conversation = await this.prisma.conversation.upsert({
      where: { contactId: contact.id },
      create: {
        workspaceId: igAccount.workspaceId,
        igAccountId: igAccount.id,
        contactId: contact.id,
        lastMessageAt: now,
        unreadCount: 1,
      },
      update: {
        lastMessageAt: now,
        unreadCount: { increment: 1 },
      },
    });

    let message;
    try {
      message = await this.prisma.message.create({
        data: {
          workspaceId: igAccount.workspaceId,
          conversationId: conversation.id,
          direction: "IN",
          source: "CONTACT",
          status: "SENT",
          text: input.text || null,
          igMessageId: input.mid ?? null,
          sentAt: now,
        },
      });
    } catch (err) {
      if ((err as { code?: string })?.code === "P2002") {
        // Same mid already ingested (replayed delivery) — nothing to do.
        this.logger.debug(`Duplicate igMessageId skipped: ${input.mid}`);
        return;
      }
      throw err;
    }

    if (conversation.mode === "BOT") {
      const trigger: FlowRunJob = {
        kind: "trigger",
        workspaceId: igAccount.workspaceId,
        igAccountId: igAccount.id,
        contactId: contact.id,
        conversationId: conversation.id,
        messageId: message.id,
        trigger: {
          source: input.source,
          text: input.text,
          ...(input.postId ? { postId: input.postId } : {}),
          ...(input.commentId ? { commentId: input.commentId } : {}),
        },
      };
      await this.flowQueue.add("trigger", trigger);
    }

    this.inbox.emitToWorkspace(
      igAccount.workspaceId,
      WS_EVENTS.MESSAGE_CREATED,
      message,
    );
    this.inbox.emitToWorkspace(
      igAccount.workspaceId,
      WS_EVENTS.CONVERSATION_UPDATED,
      conversation,
    );
  }

  /** Check whether a contact follows the business account, using the IG User Profile API. */
  private async lookupFollowStatus(
    igAccount: IgAccount,
    senderIgUserId: string,
  ): Promise<boolean> {
    try {
      const token = this.tokenCrypto.decrypt(igAccount.tokenEncrypted);
      const profile = await this.graph.getUserProfile(senderIgUserId, token);
      return profile.isUserFollowBusiness === true;
    } catch (err) {
      this.logger.warn(
        `Follow status lookup failed for ${senderIgUserId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return false;
    }
  }

  /** Returns true when a post's `requireFollow` gate is active for the given IG post id. */
  private async postRequiresFollow(postId: string): Promise<boolean> {
    try {
      const post = await this.prisma.post.findFirst({
        where: { postid: postId, requireFollow: true },
        select: { id: true },
      });
      return post != null;
    } catch {
      return false;
    }
  }
}
