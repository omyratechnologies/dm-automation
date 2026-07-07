import { ServiceUnavailableException } from "@nestjs/common";
import type Stripe from "stripe";
import { BillingService } from "./billing.service";

interface Fixture {
  service: BillingService;
  prisma: {
    organization: { findUnique: jest.Mock; update: jest.Mock };
    membership: { findFirst: jest.Mock };
    usageCounter: { findUnique: jest.Mock };
  };
  audit: { log: jest.Mock };
}

function makeFixture(opts: { org?: Record<string, unknown> } = {}): Fixture {
  const org = {
    id: "org-1",
    name: "Acme",
    ownerId: "user-1",
    plan: "FREE",
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
    ...opts.org,
  };
  const config = { get: jest.fn().mockReturnValue("") };
  const prisma = {
    organization: {
      findUnique: jest.fn().mockResolvedValue(org),
      update: jest.fn().mockResolvedValue(org),
    },
    membership: { findFirst: jest.fn().mockResolvedValue({ id: "m-1" }) },
    usageCounter: { findUnique: jest.fn().mockResolvedValue(null) },
  };
  const audit = { log: jest.fn() };
  const service = new BillingService(
    config as never,
    prisma as never,
    audit as never,
  );
  return { service, prisma, audit };
}

function subEvent(
  type: Stripe.Event["type"],
  sub: Partial<Stripe.Subscription>,
): Stripe.Event {
  return {
    id: "evt_1",
    type,
    data: { object: { id: "sub_1", customer: "cus_1", ...sub } },
  } as unknown as Stripe.Event;
}

describe("BillingService stripe event handling", () => {
  const periodEnd = 1_782_000_000; // unix seconds

  it("maps subscription.updated status=active to PRO with period end", async () => {
    const f = makeFixture();
    await f.service.handleStripeEvent(
      subEvent("customer.subscription.updated", {
        status: "active",
        current_period_end: periodEnd,
      } as Partial<Stripe.Subscription>),
    );

    expect(f.prisma.organization.update).toHaveBeenCalledWith({
      where: { id: "org-1" },
      data: {
        plan: "PRO",
        stripeSubscriptionId: "sub_1",
        currentPeriodEnd: new Date(periodEnd * 1000),
      },
    });
    expect(f.audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "billing.plan_changed",
        actorType: "SYSTEM",
        meta: { from: "FREE", to: "PRO" },
      }),
    );
  });

  it("maps subscription.updated status=trialing to PRO", async () => {
    const f = makeFixture();
    await f.service.handleStripeEvent(
      subEvent("customer.subscription.updated", {
        status: "trialing",
        current_period_end: periodEnd,
      } as Partial<Stripe.Subscription>),
    );
    expect(f.prisma.organization.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ plan: "PRO" }) }),
    );
  });

  it("maps subscription.updated status=canceled to FREE", async () => {
    const f = makeFixture({ org: { plan: "PRO" } });
    await f.service.handleStripeEvent(
      subEvent("customer.subscription.updated", {
        status: "canceled",
      } as Partial<Stripe.Subscription>),
    );

    expect(f.prisma.organization.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ plan: "FREE" }),
      }),
    );
    expect(f.audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ meta: { from: "PRO", to: "FREE" } }),
    );
  });

  it("downgrades to FREE and clears the subscription on deletion", async () => {
    const f = makeFixture({ org: { plan: "PRO" } });
    await f.service.handleStripeEvent(
      subEvent("customer.subscription.deleted", {
        status: "canceled",
      } as Partial<Stripe.Subscription>),
    );

    expect(f.prisma.organization.update).toHaveBeenCalledWith({
      where: { id: "org-1" },
      data: { plan: "FREE", stripeSubscriptionId: null },
    });
  });

  it("upgrades to PRO on checkout.session.completed", async () => {
    const f = makeFixture();
    await f.service.handleStripeEvent({
      id: "evt_2",
      type: "checkout.session.completed",
      data: { object: { customer: "cus_1", subscription: "sub_9" } },
    } as unknown as Stripe.Event);

    expect(f.prisma.organization.update).toHaveBeenCalledWith({
      where: { id: "org-1" },
      data: { plan: "PRO", stripeSubscriptionId: "sub_9" },
    });
  });

  it("does not audit when the plan is unchanged", async () => {
    const f = makeFixture({ org: { plan: "PRO" } });
    await f.service.handleStripeEvent(
      subEvent("customer.subscription.updated", {
        status: "active",
        current_period_end: periodEnd,
      } as Partial<Stripe.Subscription>),
    );
    expect(f.audit.log).not.toHaveBeenCalled();
  });

  it("ignores events for unknown customers", async () => {
    const f = makeFixture();
    f.prisma.organization.findUnique.mockResolvedValue(null);
    await f.service.handleStripeEvent(
      subEvent("customer.subscription.updated", {
        status: "active",
      } as Partial<Stripe.Subscription>),
    );
    expect(f.prisma.organization.update).not.toHaveBeenCalled();
  });

  it("throws 503 from getStripe when STRIPE_SECRET_KEY is empty", () => {
    const f = makeFixture();
    expect(() => f.service.getStripe()).toThrow(ServiceUnavailableException);
  });
});
