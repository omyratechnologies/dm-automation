import { BadRequestException } from "@nestjs/common";
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
    igAccount: { updateMany: jest.Mock };
    contact: { deleteMany: jest.Mock; count: jest.Mock };
    dataDeletionRequest: { create: jest.Mock; update: jest.Mock };
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
  const prisma = {
    igAccount: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    contact: {
      deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
      count: jest.fn().mockResolvedValue(4),
    },
    dataDeletionRequest: {
      create: jest.fn().mockResolvedValue({ id: "ddr-1" }),
      update: jest.fn().mockResolvedValue({}),
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
  it("disconnects the ig account on deauthorize", async () => {
    const f = makeFixture();
    const res = await f.service.deauthorize(
      makeSignedRequest({ user_id: "ig-123" }),
    );

    expect(res).toEqual({ received: true });
    expect(f.prisma.igAccount.updateMany).toHaveBeenCalledWith({
      where: { igUserId: "ig-123" },
      data: { status: "DISCONNECTED" },
    });
  });

  it("purges contacts, disconnects the account and returns a status url", async () => {
    const f = makeFixture();
    const res = await f.service.dataDeletion(
      makeSignedRequest({ user_id: "ig-123" }),
    );

    expect(f.prisma.dataDeletionRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: "ig-123" }),
    });
    expect(f.prisma.contact.deleteMany).toHaveBeenCalledWith({
      where: { igUserId: "ig-123" },
    });
    expect(f.prisma.igAccount.updateMany).toHaveBeenCalledWith({
      where: { igUserId: "ig-123" },
      data: { status: "DISCONNECTED" },
    });
    expect(f.prisma.dataDeletionRequest.update).toHaveBeenCalledWith({
      where: { id: "ddr-1" },
      data: expect.objectContaining({ status: "completed" }),
    });
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
    expect(f.prisma.contact.deleteMany).not.toHaveBeenCalled();
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

describe("GdprService analytics overview", () => {
  it("returns the counts shape filtered by workspace", async () => {
    const f = makeFixture();
    f.prisma.message.count.mockImplementation(
      ({ where }: { where: { direction: string; status?: string } }) => {
        if (where.direction === "IN") return Promise.resolve(7);
        if (where.status === "SENT") return Promise.resolve(8);
        if (where.status === "FAILED") return Promise.resolve(1);
        if (where.status === "REJECTED") return Promise.resolve(2);
        return Promise.resolve(11); // all OUT in window
      },
    );

    const res = await f.service.analyticsOverview("ws-1", 30);

    expect(res).toEqual({
      days: 30,
      sends: 11,
      delivered: 8,
      failed: 1,
      rejected: 2,
      inbound: 7,
      newContacts: 4,
      activeFlows: 2,
      broadcasts: 1,
    });
    expect(f.prisma.flow.count).toHaveBeenCalledWith({
      where: { workspaceId: "ws-1", status: "ACTIVE" },
    });
    // Every message count is workspace-scoped.
    for (const call of f.prisma.message.count.mock.calls) {
      expect(call[0].where.workspaceId).toBe("ws-1");
    }
  });
});
