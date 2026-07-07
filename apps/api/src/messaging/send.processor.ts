import { Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job, UnrecoverableError } from "bullmq";
import {
  HUMAN_AGENT_WINDOW_MS,
  MESSAGING_WINDOW_MS,
  PLANS,
  QUEUES,
  SEND_REJECTIONS,
  WS_EVENTS,
} from "@repo/shared";
import type { PlanKey, SendMessageJob } from "@repo/shared";
import type { Message } from "@prisma/client";
import { TokenCrypto } from "../common/crypto/kms";
import { InboxGateway } from "../inbox/inbox.gateway";
import { IgApiError, RateLimitedError } from "../instagram/errors";
import { IgGraphClient } from "../instagram/ig-graph.client";
import type { SendResult } from "../instagram/ig-graph.client";
import { PrismaService } from "../prisma/prisma.service";
import { RateLimiterService } from "./rate-limiter.service";

/** Billing period key for now, e.g. "2026-07" (UTC). */
export function currentPeriod(now: Date = new Date()): string {
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}-${month}`;
}

/**
 * Single enforcement point for compliant Instagram sending: the 24h messaging
 * window, the 7-day HUMAN_AGENT window and plan send limits are all checked
 * here — regardless of whether the send came from an agent, flow or broadcast.
 */
@Processor(QUEUES.SEND_MESSAGES, { concurrency: 5 })
export class SendProcessor extends WorkerHost {
  private readonly logger = new Logger(SendProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly graph: IgGraphClient,
    private readonly tokenCrypto: TokenCrypto,
    private readonly inbox: InboxGateway,
    private readonly rateLimiter: RateLimiterService,
  ) {
    super();
  }

  async process(job: Job<SendMessageJob>): Promise<void> {
    const data = job.data;

    const message = await this.prisma.message.findUnique({
      where: { id: data.messageId },
    });
    if (!message || message.status !== "QUEUED") return;

    const [contact, igAccount] = await Promise.all([
      this.prisma.contact.findUnique({ where: { id: data.contactId } }),
      this.prisma.igAccount.findUnique({
        where: { id: data.igAccountId },
        include: { workspace: { include: { organization: true } } },
      }),
    ]);
    if (!contact || !igAccount) {
      await this.finalize(message, data, "FAILED", "MISSING_ENTITIES");
      return;
    }
    if (igAccount.status === "DISCONNECTED") {
      await this.finalize(message, data, "FAILED", "ACCOUNT_DISCONNECTED");
      return;
    }

    // --- Messaging window enforcement ---------------------------------
    if (!contact.lastInboundAt) {
      await this.finalize(message, data, "REJECTED", SEND_REJECTIONS.NO_CONSENT);
      return;
    }
    const age = Date.now() - contact.lastInboundAt.getTime();
    let useHumanAgentTag = false;
    if (age > MESSAGING_WINDOW_MS) {
      if (data.humanAgent && age <= HUMAN_AGENT_WINDOW_MS) {
        useHumanAgentTag = true;
      } else {
        await this.finalize(
          message,
          data,
          "REJECTED",
          data.humanAgent
            ? SEND_REJECTIONS.HUMAN_AGENT_WINDOW_EXPIRED
            : SEND_REJECTIONS.WINDOW_EXPIRED,
        );
        return;
      }
    }

    // --- Plan limit enforcement ----------------------------------------
    const organization = igAccount.workspace.organization;
    const period = currentPeriod();
    const usage = await this.prisma.usageCounter.findUnique({
      where: {
        organizationId_period: { organizationId: organization.id, period },
      },
    });
    const monthlySends = PLANS[organization.plan as PlanKey].monthlySends;
    if ((usage?.sends ?? 0) >= monthlySends) {
      await this.finalize(message, data, "REJECTED", SEND_REJECTIONS.PLAN_LIMIT);
      return;
    }

    // --- Local rate limit check (200/hr per IG account) ------------------
    if (!(await this.rateLimiter.canSend(data.igAccountId))) {
      throw new RateLimitedError("Local rate limit: 200 sends/hr reached");
    }

    // --- Send ------------------------------------------------------------
    let token: string;
    try {
      token = this.tokenCrypto.decrypt(igAccount.tokenEncrypted);
    } catch {
      await this.finalize(message, data, "FAILED", "TOKEN_DECRYPT_FAILED");
      return;
    }
    let result: SendResult;
    try {
      result = data.replyToCommentId
        ? await this.graph.privateReplyToComment(
            igAccount.igUserId,
            data.replyToCommentId,
            data.text,
            token,
          )
        : await this.graph.sendDm(
            igAccount.igUserId,
            contact.igUserId,
            data.text,
            token,
            { quickReplies: data.quickReplies, humanAgent: useHumanAgentTag },
          );
    } catch (err) {
      if (err instanceof RateLimitedError) {
        // Backed off + retried by BullMQ (exponential backoff configured).
        throw err;
      }
      if (err instanceof IgApiError && err.isClientError) {
        const code =
          err.metaCode !== undefined
            ? `IG_${err.metaCode}`
            : `HTTP_${err.status}`;
        await this.finalize(message, data, "FAILED", code);
        throw new UnrecoverableError(err.message);
      }
      // Network / 5xx — let BullMQ retry.
      throw err;
    }

    // --- Success bookkeeping ----------------------------------------------
    const sentAt = new Date();
    const updated = await this.prisma.message.update({
      where: { id: message.id },
      data: {
        status: "SENT",
        sentAt,
        igMessageId: result.messageId ?? null,
        humanAgentTag: useHumanAgentTag,
      },
    });
    await Promise.all([
      this.rateLimiter.recordSend(data.igAccountId),
      this.prisma.contact.update({
        where: { id: contact.id },
        data: { lastOutboundAt: sentAt },
      }),
      this.prisma.conversation.update({
        where: { id: message.conversationId },
        data: { lastMessageAt: sentAt },
      }),
      this.prisma.usageCounter.upsert({
        where: {
          organizationId_period: { organizationId: organization.id, period },
        },
        create: { organizationId: organization.id, period, sends: 1 },
        update: { sends: { increment: 1 } },
      }),
      ...(data.broadcastId
        ? [
            this.prisma.broadcast.update({
              where: { id: data.broadcastId },
              data: { sentCount: { increment: 1 } },
            }),
          ]
        : []),
    ]);
    this.inbox.emitToWorkspace(
      data.workspaceId,
      WS_EVENTS.MESSAGE_CREATED,
      updated,
    );
  }

  /**
   * Terminal non-retryable outcome: REJECTED (compliance/limits) or FAILED
   * (permanent API error). Updates broadcast counters and notifies the inbox.
   */
  private async finalize(
    message: Message,
    data: SendMessageJob,
    status: "REJECTED" | "FAILED",
    errorCode: string,
  ): Promise<void> {
    this.logger.warn(`Send ${message.id} ${status.toLowerCase()}: ${errorCode}`);
    const updated = await this.prisma.message.update({
      where: { id: message.id },
      data: { status, errorCode },
    });
    if (data.broadcastId) {
      await this.prisma.broadcast.update({
        where: { id: data.broadcastId },
        data:
          status === "REJECTED"
            ? { skippedCount: { increment: 1 } }
            : { failedCount: { increment: 1 } },
      });
    }
    this.inbox.emitToWorkspace(
      data.workspaceId,
      WS_EVENTS.MESSAGE_CREATED,
      updated,
    );
  }
}
