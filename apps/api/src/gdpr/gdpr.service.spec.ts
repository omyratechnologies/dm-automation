import { BadRequestException, NotFoundException } from "@nestjs/common";
import * as crypto from "crypto";
import { GdprService } from "./gdpr.service";

const APP_SECRET = "test-app-secret";
const WEB_ORIGIN = "https://app.example.com";

function makeSignedRequest(
  payload: Record<string, unknown>,
  secret = APP_SECRET,
): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");
  return `${sig}.${encoded}`;
}

interface Fixture {
  service: GdprService;
  prisma: {
    $transaction: jest.Mock;
    igAccount: { findUnique: jest.Mock; delete: jest.Mock };
    webhookEvent: { deleteMany: jest.Mock };
    contact: { deleteMany: jest.Mock; count: jest.Mock };
    dataDeletionRequest: {
      create: jest.Mock;
      update: jest.Mock;
      findUnique: jest.Mock;
    };
    workspace: { findUnique: jest.Mock; delete: jest.Mock };
    message: { count: jest.Mock };
    flow: { count: jest.Mock };
    broadcast: { count: jest.Mock };
  };
  audit: { log: jest.Mock };
}

function makeFixture(): Fixture {
  const config = {
    get: jest.fn((key: string) => {
      if (key === "INSTAGRAM_APP_SECRET") return APP_SECRET;
      if (key === "WEB_ORIGIN") return WEB_ORIGIN;
      return "";
    }),
  };
  let prisma!: Fixture["prisma"];
  prisma = {
    $transaction: jest.fn(async (fn: (tx: unknown) => unknown) => fn(prisma)),
    igAccount: {
      findUnique: jest.fn().mockResolvedValue({ id: "iga-1" }),
      delete: jest.fn().mockResolvedValue({ id: "iga-1" }),
    },
    webhookEvent: { deleteMany: jest.fn().mockResolvedValue({ count: 2 }) },
    contact: {
      deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
      count: jest.fn().mockResolvedValue(4),
    },
    dataDeletionRequest: {
      create: jest.fn().mockResolvedValue({ id: "ddr-1" }),
      update: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
    },
    workspace: {
      findUnique: jest.fn().mockResolvedValue({ id: "ws-1", name: "Main" }),
      delete: jest.fn().mockResolvedValue({}),
    },
    message: { count: jest.fn() },
    flow: { count: jest.fn().mockResolvedValue(2) },
    broadcast: { count: jest.fn().mockResolvedValue(1) },
  };
  const audit = { log: jest.fn() };
  const service = new GdprService(
    config as never,
    prisma as never,
    audit as never,
  );
  return { service, prisma, audit };
}

describe("GdprService signed_request verification", () => {
  it("parses a validly signed request", () => {
    const f = makeFixture();
    const parsed = f.service.parseSignedRequest(
      makeSignedRequest({ user_id: "ig-123", algorithm: "HMAC-SHA256" }),
    );
    expect(parsed.user_id).toBe("ig-123");
  });

  it("rejects a tampered payload", () => {
    const f = makeFixture();
    const valid = makeSignedRequest({ user_id: "ig-123" });
    const [sig] = valid.split(".");
    const forged = Buffer.from(
      JSON.stringify({ user_id: "ig-999" }),
    ).toString("base64url");

    expect(() => f.service.parseSignedRequest(`${sig}.${forged}`)).toThrow(
      BadRequestException,
    );
  });

  it("rejects a request signed with the wrong secret", () => {
    const f = makeFixture();
    expect(() =>
      f.service.parseSignedRequest(
        makeSignedRequest({ user_id: "ig-123" }, "wrong-secret"),
      ),
    ).toThrow(BadRequestException);
  });

  it("rejects missing or malformed input", () => {
    const f = makeFixture();
    expect(() => f.service.parseSignedRequest(undefined)).toThrow(
      BadRequestException,
    );
    expect(() => f.service.parseSignedRequest("no-dot-here")).toThrow(
      BadRequestException,
    );
  });
});

describe("GdprService deauthorize / data deletion", () => {
  it("purges the connected account and Instagram webhook payloads on deauthorize", async () => {
    const f = makeFixture();
    const res = await f.service.deauthorize(
      makeSignedRequest({ user_id: "ig-123" }),
    );

    expect(res).toEqual({ received: true });
    expect(f.prisma.webhookEvent.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { igAccountId: "iga-1" },
          { payload: { path: ["id"], equals: "ig-123" } },
        ],
      },
    });
    expect(f.prisma.igAccount.delete).toHaveBeenCalledWith({
      where: { id: "iga-1" },
    });
  });

  it("atomically purges Instagram data and returns a status url", async () => {
    const f = makeFixture();
    const res = await f.service.dataDeletion(
      makeSignedRequest({ user_id: "ig-123" }),
    );

    expect(f.prisma.dataDeletionRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: "ig-123" }),
    });
    expect(f.prisma.webhookEvent.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { igAccountId: "iga-1" },
          { payload: { path: ["id"], equals: "ig-123" } },
        ],
      },
    });
    expect(f.prisma.igAccount.delete).toHaveBeenCalledWith({
      where: { id: "iga-1" },
    });
    expect(f.prisma.dataDeletionRequest.update).toHaveBeenCalledWith({
      where: { id: "ddr-1" },
      data: expect.objectContaining({ status: "completed", userId: null }),
    });
    expect(f.prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(res.confirmation_code).toMatch(/^[0-9a-f]{12}$/);
    expect(res.url).toBe(
      `${WEB_ORIGIN}/data-deletion-status/${res.confirmation_code}`,
    );
  });

  it("rejects data deletion with an invalid signature", async () => {
    const f = makeFixture();
    await expect(
      f.service.dataDeletion(
        makeSignedRequest({ user_id: "ig-123" }, "wrong-secret"),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(f.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("still removes matching webhook payloads when the account is already gone", async () => {
    const f = makeFixture();
    f.prisma.igAccount.findUnique.mockResolvedValue(null);

    await f.service.dataDeletion(
      makeSignedRequest({ user_id: "ig-removed" }),
    );

    expect(f.prisma.webhookEvent.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [{ payload: { path: ["id"], equals: "ig-removed" } }],
      },
    });
    expect(f.prisma.igAccount.delete).not.toHaveBeenCalled();
  });

  it("returns a deletion status without exposing the Meta user id", async () => {
    const f = makeFixture();
    const requestedAt = new Date("2026-08-18T10:00:00.000Z");
    const completedAt = new Date("2026-08-18T10:00:01.000Z");
    f.prisma.dataDeletionRequest.findUnique.mockResolvedValue({
      confirmationCode: "a1b2c3d4e5f6",
      status: "completed",
      requestedAt,
      completedAt,
    });

    await expect(
      f.service.dataDeletionStatus("a1b2c3d4e5f6"),
    ).resolves.toEqual({
      confirmationCode: "a1b2c3d4e5f6",
      status: "completed",
      requestedAt,
      completedAt,
    });
    expect(f.prisma.dataDeletionRequest.findUnique).toHaveBeenCalledWith({
      where: { confirmationCode: "a1b2c3d4e5f6" },
      select: {
        confirmationCode: true,
        status: true,
        requestedAt: true,
        completedAt: true,
      },
    });
  });

  it("rejects an unknown deletion confirmation code", async () => {
    const f = makeFixture();
    f.prisma.dataDeletionRequest.findUnique.mockResolvedValue(null);

    await expect(
      f.service.dataDeletionStatus("000000000000"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe("GdprService workspace deletion", () => {
  it("deletes the workspace and writes an org-level audit entry", async () => {
    const f = makeFixture();
    const res = await f.service.deleteWorkspace(
      { id: "ws-1", organizationId: "org-1", role: "OWNER" },
      { id: "user-1", clerkId: "clerk-1", email: "o@x.com" },
    );

    expect(res).toEqual({ deleted: true });
    expect(f.prisma.workspace.delete).toHaveBeenCalledWith({
      where: { id: "ws-1" },
    });
    expect(f.audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        action: "workspace.deleted",
        targetId: "ws-1",
      }),
    );
  });
});
