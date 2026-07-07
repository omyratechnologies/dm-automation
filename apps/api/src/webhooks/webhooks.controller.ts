import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import type { RawBodyRequest } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import type { Request } from "express";
import * as crypto from "crypto";
import { QUEUES } from "@repo/shared";
import type { WebhookEventJob } from "@repo/shared";
import type { Prisma } from "@prisma/client";
import { Public } from "../auth/public.decorator";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Instagram webhook receiver. Public routes (Meta calls them), protected by
 * verify-token (GET) and X-Hub-Signature-256 HMAC (POST). The POST path only
 * persists + enqueues — all processing happens in WebhookEventsProcessor.
 */
@Public()
@SkipThrottle()
@Controller("webhooks")
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUES.WEBHOOK_EVENTS)
    private readonly webhookQueue: Queue<WebhookEventJob>,
  ) {}

  /** Meta subscription handshake: echo hub.challenge when the token matches. */
  @Get("instagram")
  verify(
    @Query("hub.mode") mode?: string,
    @Query("hub.verify_token") verifyToken?: string,
    @Query("hub.challenge") challenge?: string,
  ): string {
    const expected = this.config.get<string>("INSTAGRAM_WEBHOOK_VERIFY_TOKEN");
    if (mode === "subscribe" && expected && verifyToken === expected) {
      return challenge ?? "";
    }
    throw new ForbiddenException("Webhook verification failed");
  }

  @Post("instagram")
  @HttpCode(HttpStatus.OK)
  async receive(
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ received: boolean }> {
    const signature = req.headers["x-hub-signature-256"];
    if (
      !req.rawBody ||
      !this.verifySignature(
        req.rawBody,
        typeof signature === "string" ? signature : undefined,
      )
    ) {
      throw new ForbiddenException("Invalid webhook signature");
    }

    const body = req.body as { entry?: unknown[] } | undefined;
    const entries = Array.isArray(body?.entry) ? body.entry : [];
    for (const entry of entries) {
      await this.ingestEntry(entry);
    }
    return { received: true };
  }

  /** Constant-time HMAC-SHA256 check of the raw body against the app secret. */
  private verifySignature(rawBody: Buffer, header?: string): boolean {
    const secret = this.config.get<string>("INSTAGRAM_APP_SECRET");
    if (!secret || !header?.startsWith("sha256=")) return false;

    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    const given = header.slice("sha256=".length);

    const expectedBuf = Buffer.from(expected, "utf8");
    const givenBuf = Buffer.from(given, "utf8");
    // timingSafeEqual throws on length mismatch — treat that as a failure.
    if (expectedBuf.length !== givenBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, givenBuf);
  }

  /**
   * Persist one webhook entry (idempotent on [provider, eventKey]) and enqueue
   * it for async processing. Duplicate deliveries are silently skipped.
   */
  private async ingestEntry(entry: unknown): Promise<void> {
    const eventKey = this.eventKeyFor(entry);

    let webhookEventId: string;
    try {
      const created = await this.prisma.webhookEvent.create({
        data: {
          provider: "INSTAGRAM",
          eventKey,
          status: "RECEIVED",
          payload: entry as Prisma.InputJsonValue,
        },
        select: { id: true },
      });
      webhookEventId = created.id;
    } catch (err) {
      if ((err as { code?: string })?.code === "P2002") {
        // Replay/duplicate delivery — already ingested.
        this.logger.debug(`Duplicate webhook event skipped: ${eventKey}`);
        return;
      }
      throw err;
    }

    await this.webhookQueue.add("instagram-entry", { webhookEventId });
  }

  /** Message mid when present, else sha256 of the entry JSON. */
  private eventKeyFor(entry: unknown): string {
    const e = entry as {
      messaging?: Array<{ message?: { mid?: unknown } } | null>;
    } | null;
    if (Array.isArray(e?.messaging)) {
      for (const m of e.messaging) {
        const mid = m?.message?.mid;
        if (typeof mid === "string" && mid.length > 0) return mid;
      }
    }
    return crypto
      .createHash("sha256")
      .update(JSON.stringify(entry ?? null))
      .digest("hex");
  }
}
