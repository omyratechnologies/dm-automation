import { ForbiddenException } from "@nestjs/common";
import * as crypto from "crypto";
import { WebhooksController } from "./webhooks.controller";

const APP_SECRET = "test-app-secret";
const VERIFY_TOKEN = "test-verify-token";

function makeController(configOverrides: Record<string, string | undefined> = {}) {
  const values: Record<string, string | undefined> = {
    INSTAGRAM_APP_SECRET: APP_SECRET,
    INSTAGRAM_WEBHOOK_VERIFY_TOKEN: VERIFY_TOKEN,
    ...configOverrides,
  };
  const config = { get: jest.fn((key: string) => values[key]) };
  const prisma = {
    webhookEvent: {
      create: jest.fn().mockResolvedValue({ id: "evt-1" }),
    },
  };
  const queue = { add: jest.fn().mockResolvedValue(undefined) };
  const controller = new WebhooksController(
    config as never,
    prisma as never,
    queue as never,
  );
  return { controller, prisma, queue };
}

function sign(raw: Buffer, secret = APP_SECRET): string {
  return (
    "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex")
  );
}

function makeRequest(body: unknown, signature?: string, rawBody?: Buffer) {
  const raw = rawBody ?? Buffer.from(JSON.stringify(body));
  return {
    rawBody: raw,
    body,
    headers:
      signature === undefined ? {} : { "x-hub-signature-256": signature },
  } as never;
}

describe("WebhooksController", () => {
  describe("GET verify", () => {
    it("echoes the challenge when the verify token matches", () => {
      const { controller } = makeController();
      expect(controller.verify("subscribe", VERIFY_TOKEN, "12345")).toBe(
        "12345",
      );
    });

    it("rejects a wrong verify token", () => {
      const { controller } = makeController();
      expect(() => controller.verify("subscribe", "wrong", "12345")).toThrow(
        ForbiddenException,
      );
    });
  });

  describe("signature verification", () => {
    const body = { object: "instagram", entry: [{ id: "ig-1", messaging: [] }] };

    it("accepts a valid signature and enqueues the event", async () => {
      const { controller, prisma, queue } = makeController();
      const raw = Buffer.from(JSON.stringify(body));
      const res = await controller.receive(makeRequest(body, sign(raw), raw));
      expect(res).toEqual({ received: true });
      expect(prisma.webhookEvent.create).toHaveBeenCalledTimes(1);
      expect(queue.add).toHaveBeenCalledWith("instagram-entry", {
        webhookEventId: "evt-1",
      });
    });

    it("rejects an invalid signature (wrong secret)", async () => {
      const { controller, prisma } = makeController();
      const raw = Buffer.from(JSON.stringify(body));
      await expect(
        controller.receive(makeRequest(body, sign(raw, "other-secret"), raw)),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.webhookEvent.create).not.toHaveBeenCalled();
    });

    it("rejects a missing signature header", async () => {
      const { controller } = makeController();
      await expect(
        controller.receive(makeRequest(body, undefined)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("rejects a signature with mismatched length without throwing internally", async () => {
      const { controller } = makeController();
      await expect(
        controller.receive(makeRequest(body, "sha256=deadbeef")),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("rejects when rawBody is unavailable", async () => {
      const { controller } = makeController();
      const req = {
        rawBody: undefined,
        body,
        headers: { "x-hub-signature-256": "sha256=abc" },
      } as never;
      await expect(controller.receive(req)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe("dedupe / replay protection", () => {
    it("skips duplicate events on unique-constraint violation and still returns 200", async () => {
      const { controller, prisma, queue } = makeController();
      prisma.webhookEvent.create.mockRejectedValueOnce(
        Object.assign(new Error("Unique constraint failed"), {
          code: "P2002",
        }),
      );
      const body = {
        object: "instagram",
        entry: [
          { id: "ig-1", messaging: [{ message: { mid: "mid-dup" } }] },
          { id: "ig-1", messaging: [{ message: { mid: "mid-new" } }] },
        ],
      };
      const raw = Buffer.from(JSON.stringify(body));

      const res = await controller.receive(makeRequest(body, sign(raw), raw));

      expect(res).toEqual({ received: true });
      // First entry hit P2002 and was skipped; second entry was enqueued.
      expect(prisma.webhookEvent.create).toHaveBeenCalledTimes(2);
      expect(queue.add).toHaveBeenCalledTimes(1);
    });

    it("uses the message mid as the event key when present", async () => {
      const { controller, prisma } = makeController();
      const body = {
        object: "instagram",
        entry: [{ id: "ig-1", messaging: [{ message: { mid: "mid-42" } }] }],
      };
      const raw = Buffer.from(JSON.stringify(body));
      await controller.receive(makeRequest(body, sign(raw), raw));

      expect(prisma.webhookEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eventKey: "mid-42" }),
        }),
      );
    });

    it("falls back to a sha256 event key when no mid is present", async () => {
      const { controller, prisma } = makeController();
      const entry = { id: "ig-1", changes: [{ field: "comments" }] };
      const body = { object: "instagram", entry: [entry] };
      const raw = Buffer.from(JSON.stringify(body));
      await controller.receive(makeRequest(body, sign(raw), raw));

      const expectedKey = crypto
        .createHash("sha256")
        .update(JSON.stringify(entry))
        .digest("hex");
      expect(prisma.webhookEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eventKey: expectedKey }),
        }),
      );
    });
  });
});
