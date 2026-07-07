import { BadRequestException } from "@nestjs/common";
import { StripeWebhookController } from "./stripe-webhook.controller";

interface Fixture {
  controller: StripeWebhookController;
  prisma: { webhookEvent: { create: jest.Mock; update: jest.Mock } };
  billing: { getStripe: jest.Mock; handleStripeEvent: jest.Mock };
  constructEvent: jest.Mock;
}

function makeFixture(opts: { webhookSecret?: string } = {}): Fixture {
  const config = {
    get: jest.fn((key: string) =>
      key === "STRIPE_WEBHOOK_SECRET"
        ? (opts.webhookSecret ?? "whsec_test")
        : "",
    ),
  };
  const prisma = {
    webhookEvent: {
      create: jest.fn().mockResolvedValue({ id: "we-1" }),
      update: jest.fn().mockResolvedValue({}),
    },
  };
  const constructEvent = jest.fn().mockReturnValue({
    id: "evt_1",
    type: "customer.subscription.updated",
    data: { object: {} },
  });
  const billing = {
    getStripe: jest.fn().mockReturnValue({ webhooks: { constructEvent } }),
    handleStripeEvent: jest.fn().mockResolvedValue(undefined),
  };
  const controller = new StripeWebhookController(
    config as never,
    prisma as never,
    billing as never,
  );
  return { controller, prisma, billing, constructEvent };
}

function makeReq(overrides: Record<string, unknown> = {}) {
  return {
    rawBody: Buffer.from('{"id":"evt_1"}'),
    headers: { "stripe-signature": "t=1,v1=sig" },
    ...overrides,
  } as never;
}

describe("StripeWebhookController", () => {
  it("returns 400 on invalid signature", async () => {
    const f = makeFixture();
    f.constructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature");
    });

    await expect(f.controller.handle(makeReq())).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(f.prisma.webhookEvent.create).not.toHaveBeenCalled();
    expect(f.billing.handleStripeEvent).not.toHaveBeenCalled();
  });

  it("returns 400 when the stripe-signature header is missing", async () => {
    const f = makeFixture();
    await expect(
      f.controller.handle(makeReq({ headers: {} })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(f.billing.handleStripeEvent).not.toHaveBeenCalled();
  });

  it("processes a valid event once and marks it PROCESSED", async () => {
    const f = makeFixture();
    const res = await f.controller.handle(makeReq());

    expect(res).toEqual({ received: true });
    expect(f.prisma.webhookEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          provider: "STRIPE",
          eventKey: "evt_1",
          status: "RECEIVED",
        }),
      }),
    );
    expect(f.billing.handleStripeEvent).toHaveBeenCalledTimes(1);
    expect(f.prisma.webhookEvent.update).toHaveBeenCalledWith({
      where: { id: "we-1" },
      data: expect.objectContaining({ status: "PROCESSED" }),
    });
  });

  it("skips processing on duplicate event delivery", async () => {
    const f = makeFixture();
    f.prisma.webhookEvent.create.mockRejectedValueOnce({ code: "P2002" });

    const res = await f.controller.handle(makeReq());

    expect(res).toEqual({ received: true, duplicate: true });
    expect(f.billing.handleStripeEvent).not.toHaveBeenCalled();
    expect(f.prisma.webhookEvent.update).not.toHaveBeenCalled();
  });

  it("marks the event FAILED when processing throws, still acks", async () => {
    const f = makeFixture();
    f.billing.handleStripeEvent.mockRejectedValueOnce(new Error("boom"));

    const res = await f.controller.handle(makeReq());

    expect(res).toEqual({ received: true });
    expect(f.prisma.webhookEvent.update).toHaveBeenCalledWith({
      where: { id: "we-1" },
      data: expect.objectContaining({ status: "FAILED", error: "boom" }),
    });
  });
});
