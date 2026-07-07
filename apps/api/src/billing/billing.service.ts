import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { PLANS, type PlanKey } from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Lazy Stripe client; 503 when billing isn't configured. No bootstrap crash. */
  getStripe(): Stripe {
    const key = this.config.get<string>("STRIPE_SECRET_KEY") ?? "";
    if (!key) {
      throw new ServiceUnavailableException("billing not configured");
    }
    this.stripe ??= new Stripe(key);
    return this.stripe;
  }

  /** Current billing period key, e.g. "2026-07". */
  private currentPeriod(): string {
    return new Date().toISOString().slice(0, 7);
  }

  private async getOrg(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!org) throw new NotFoundException("Organization not found");
    return org;
  }

  /** Requester must belong to at least one workspace of the org. */
  private async assertOrgMember(userId: string, orgId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, workspace: { organizationId: orgId } },
      select: { id: true },
    });
    if (!membership) {
      throw new ForbiddenException("Not a member of this organization");
    }
  }

  async overview(user: AuthedRequestUser, orgId: string) {
    await this.assertOrgMember(user.id, orgId);
    const org = await this.getOrg(orgId);
    const usage = await this.prisma.usageCounter.findUnique({
      where: {
        organizationId_period: {
          organizationId: orgId,
          period: this.currentPeriod(),
        },
      },
    });
    const plan = org.plan as PlanKey;
    return {
      plan,
      currentPeriodEnd: org.currentPeriodEnd,
      usage: {
        period: this.currentPeriod(),
        sends: usage?.sends ?? 0,
        contacts: usage?.contacts ?? 0,
      },
      limits: PLANS[plan],
    };
  }

  async createCheckout(
    user: AuthedRequestUser,
    orgId: string,
    input: { successUrl: string; cancelUrl: string },
  ) {
    const stripe = this.getStripe();
    const priceId = this.config.get<string>("STRIPE_PRICE_PRO") ?? "";
    if (!priceId) {
      throw new ServiceUnavailableException("billing not configured");
    }
    const org = await this.getOrg(orgId);
    if (org.ownerId !== user.id) {
      throw new ForbiddenException(
        "Only the organization owner can manage billing",
      );
    }

    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: org.name,
        metadata: { organizationId: org.id },
      });
      customerId = customer.id;
      await this.prisma.organization.update({
        where: { id: org.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: { organizationId: org.id },
      subscription_data: { metadata: { organizationId: org.id } },
    });
    return { url: session.url };
  }

  async createPortal(
    user: AuthedRequestUser,
    orgId: string,
    input: { returnUrl: string },
  ) {
    const stripe = this.getStripe();
    const org = await this.getOrg(orgId);
    if (org.ownerId !== user.id) {
      throw new ForbiddenException(
        "Only the organization owner can manage billing",
      );
    }
    if (!org.stripeCustomerId) {
      throw new BadRequestException("No billing account yet — checkout first");
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: input.returnUrl,
    });
    return { url: session.url };
  }

  // ---------------------------------------------------------------------
  // Stripe webhook event handling (called by StripeWebhookController)
  // ---------------------------------------------------------------------

  async handleStripeEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case "checkout.session.completed":
        await this.onCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "customer.subscription.updated":
        await this.onSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.deleted":
        await this.onSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      default:
        this.logger.debug(`ignoring stripe event type ${event.type}`);
    }
  }

  private customerIdOf(
    customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
  ): string | null {
    if (!customer) return null;
    return typeof customer === "string" ? customer : customer.id;
  }

  private async orgByCustomer(customerId: string | null) {
    if (!customerId) return null;
    return this.prisma.organization.findUnique({
      where: { stripeCustomerId: customerId },
    });
  }

  private async setPlan(
    org: { id: string; plan: string },
    plan: PlanKey,
    extra: {
      stripeSubscriptionId?: string | null;
      currentPeriodEnd?: Date | null;
    } = {},
  ) {
    await this.prisma.organization.update({
      where: { id: org.id },
      data: { plan, ...extra },
    });
    if (org.plan !== plan) {
      this.audit.log({
        organizationId: org.id,
        actorType: "SYSTEM",
        action: "billing.plan_changed",
        targetType: "Organization",
        targetId: org.id,
        meta: { from: org.plan, to: plan },
      });
    }
  }

  private async onCheckoutCompleted(session: Stripe.Checkout.Session) {
    const org = await this.orgByCustomer(this.customerIdOf(session.customer));
    if (!org) {
      this.logger.warn("checkout.session.completed for unknown customer");
      return;
    }
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : (session.subscription?.id ?? null);
    await this.setPlan(org, "PRO", { stripeSubscriptionId: subscriptionId });
  }

  private async onSubscriptionUpdated(sub: Stripe.Subscription) {
    const org = await this.orgByCustomer(this.customerIdOf(sub.customer));
    if (!org) {
      this.logger.warn("customer.subscription.updated for unknown customer");
      return;
    }
    const plan: PlanKey =
      sub.status === "active" || sub.status === "trialing" ? "PRO" : "FREE";
    await this.setPlan(org, plan, {
      stripeSubscriptionId: sub.id,
      currentPeriodEnd: sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : null,
    });
  }

  private async onSubscriptionDeleted(sub: Stripe.Subscription) {
    const org = await this.orgByCustomer(this.customerIdOf(sub.customer));
    if (!org) {
      this.logger.warn("customer.subscription.deleted for unknown customer");
      return;
    }
    await this.setPlan(org, "FREE", { stripeSubscriptionId: null });
  }
}
