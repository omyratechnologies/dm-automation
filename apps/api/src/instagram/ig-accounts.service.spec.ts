import { IgAccountsService } from "./ig-accounts.service";

function makeFixture() {
  const account = {
    id: "iga-1",
    workspaceId: "ws-1",
    igUserId: "ig-1",
    username: "business",
    status: "ACTIVE",
    tokenExpiresAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const prisma = {
    igAccount: {
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn(),
      upsert: jest.fn().mockResolvedValue(account),
      delete: jest.fn().mockResolvedValue(account),
    },
    webhookEvent: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
    $transaction: jest.fn(async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };
  const graph = {
    exchangeCodeForToken: jest.fn().mockResolvedValue({
      accessToken: "short-token",
      userId: "ig-1",
    }),
    getLongLivedToken: jest.fn().mockResolvedValue({
      accessToken: "long-token",
      expiresIn: 3600,
    }),
    getMe: jest.fn().mockResolvedValue({
      userId: "ig-1",
      username: "business",
    }),
    subscribeToWebhooks: jest.fn().mockResolvedValue(undefined),
    unsubscribeFromWebhooks: jest.fn().mockResolvedValue(undefined),
  };
  const tokenCrypto = {
    encrypt: jest.fn().mockReturnValue("encrypted-token"),
    decrypt: jest.fn().mockReturnValue("long-token"),
  };
  const audit = { log: jest.fn() };
  const config = {
    get: jest.fn((key: string) =>
      key === "INSTAGRAM_OAUTH_REDIRECT_URI"
        ? "https://gemai.example/callback/instagram"
        : undefined,
    ),
  };
  const service = new IgAccountsService(
    prisma as never,
    graph as never,
    tokenCrypto as never,
    audit as never,
    config as never,
  );
  const workspace = { id: "ws-1", organizationId: "org-1" } as never;
  const user = { id: "user-1" } as never;
  return { service, prisma, graph, tokenCrypto, audit, workspace, user, account };
}

describe("IgAccountsService", () => {
  it("uses the configured redirect URI and subscribes before persisting", async () => {
    const f = makeFixture();

    await f.service.connect(f.workspace, f.user, { code: "oauth-code" });

    expect(f.graph.exchangeCodeForToken).toHaveBeenCalledWith(
      "oauth-code",
      "https://gemai.example/callback/instagram",
    );
    expect(f.graph.subscribeToWebhooks).toHaveBeenCalledWith(
      "ig-1",
      "long-token",
    );
    expect(
      f.graph.subscribeToWebhooks.mock.invocationCallOrder[0],
    ).toBeLessThan(f.prisma.igAccount.upsert.mock.invocationCallOrder[0]);
  });

  it("does not persist an account when Meta webhook subscription fails", async () => {
    const f = makeFixture();
    f.graph.subscribeToWebhooks.mockRejectedValueOnce(
      new Error("subscription failed"),
    );

    await expect(
      f.service.connect(f.workspace, f.user, { code: "oauth-code" }),
    ).rejects.toThrow("subscription failed");
    expect(f.prisma.igAccount.upsert).not.toHaveBeenCalled();
  });

  it("deletes the token and derived account data even when unsubscribe fails", async () => {
    const f = makeFixture();
    f.prisma.igAccount.findFirst.mockResolvedValue({
      id: "iga-1",
      igUserId: "ig-1",
      tokenEncrypted: "encrypted-token",
    });
    f.graph.unsubscribeFromWebhooks.mockRejectedValueOnce(
      new Error("expired token"),
    );

    await expect(
      f.service.disconnect(f.workspace, f.user, "iga-1"),
    ).resolves.toEqual({ id: "iga-1", disconnected: true });

    expect(f.prisma.webhookEvent.deleteMany).toHaveBeenCalledWith({
      where: { igAccountId: "iga-1" },
    });
    expect(f.prisma.igAccount.delete).toHaveBeenCalledWith({
      where: { id: "iga-1" },
    });
  });
});
