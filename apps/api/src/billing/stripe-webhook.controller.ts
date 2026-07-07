import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
} from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import type Stripe from "stripe";
import type { Prisma } from "@prisma/client";
import { Public } from "../auth/public.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { BillingService } from "./billing.service";

/**
 * Stripe webhook receiver (public — Stripe calls it; protected by signature).
 * Idempotent on WebhookEvent [provider, eventKey] so replays are no-ops.
 * Mounted at POST /v1/webhooks/stripe via the global prefix.
 */
@Public()
@Controller("webhooks/stripe")
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ received: boolean; duplicate?: boolean }> {
    const signature = req.headers["stripe-signature"];
    const secret = this.config.get<string>("STRIPE_WEBHOOK_SECRET") ?? "";

    let event: Stripe.Event;
    try {
      if (!req.rawBody || typeof signature !== "string" || !secret) {
        throw new Error("missing raw body, signature or webhook secret");
      }
      event = this.billing
        .getStripe()
        .webhooks.constructEvent(req.rawBody, signature, secret);
    } catch (err) {
      this.logger.warn(
        `stripe webhook signature verification failed: ${(err as Error).message}`,
      );
      throw new BadRequestException("Invalid stripe webhook signature");
    }

    // Idempotency: unique on [provider, eventKey]. Duplicates are no-ops.
    let webhookEventId: string;
    try {
      const created = await this.prisma.webhookEvent.create({
        data: {
          provider: "STRIPE",
          eventKey: event.id,
          status: "RECEIVED",
          payload: event as unknown as Prisma.InputJsonValue,
        },
        select: { id: true },
      });
      webhookEventId = created.id;
    } catch (err) {
      if ((err as { code?: string })?.code === "P2002") {
        this.logger.debug(`duplicate stripe event skipped: ${event.id}`);
        return { received: true, duplicate: true };
      }
      throw err;
    }

    try {
      await this.billing.handleStripeEvent(event);
      await this.prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: { status: "PROCESSED", processedAt: new Date() },
      });
    } catch (err) {
      const message = (err as Error).message ?? "unknown error";
      this.logger.error(`stripe event ${event.id} failed: ${message}`);
      await this.prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: { status: "FAILED", error: message },
      });
    }
    return { received: true };
  }
}
