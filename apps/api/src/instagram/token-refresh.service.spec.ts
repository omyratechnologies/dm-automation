import { METRICS_KEYS } from "../metrics/metrics.service";
import { TokenRefreshService } from "./token-refresh.service";

function makeFixture() {
  const prisma = {
    igAccount: {
      findMany: jest.fn().mockResolvedValue([
        { id: "iga-1", tokenEncrypted: "encrypted-token" },
      ]),
      update: jest.fn().mockResolvedValue({ id: "iga-1" }),
    },
  };
  const graph = {
    refreshLongLivedToken: jest.fn().mockResolvedValue({
      accessToken: "refreshed-token",
      expiresIn: 3_600,
    }),
  };
  const tokenCrypto = {
    decrypt: jest.fn().mockReturnValue("current-token"),
    encrypt: jest.fn().mockReturnValue("encrypted-refreshed-token"),
  };
  const queue = {
    getRepeatableJobs: jest.fn().mockResolvedValue([]),
    add: jest.fn().mockResolvedValue(undefined),
  };
  const metrics = { increment: jest.fn().mockResolvedValue(undefined) };
  const service = new TokenRefreshService(
    prisma as never,
    graph as never,
    tokenCrypto as never,
    queue as never,
    metrics as never,
  );

  return { service, prisma, graph, tokenCrypto, queue, metrics };
}

describe("TokenRefreshService", () => {
  it("records each successfully refreshed Meta token", async () => {
    const f = makeFixture();

    await expect(f.service.refreshExpiringTokens()).resolves.toEqual({
      refreshed: 1,
      failed: 0,
    });

    expect(f.graph.refreshLongLivedToken).toHaveBeenCalledWith("current-token");
    expect(f.prisma.igAccount.update).toHaveBeenCalledWith({
      where: { id: "iga-1" },
      data: {
        tokenEncrypted: "encrypted-refreshed-token",
        tokenExpiresAt: expect.any(Date),
      },
    });
    expect(f.metrics.increment).toHaveBeenCalledWith(
      METRICS_KEYS.TOKENS_REFRESHED,
    );
  });

  it("does not record a failed token refresh as successful", async () => {
    const f = makeFixture();
    f.graph.refreshLongLivedToken.mockRejectedValueOnce(
      new Error("Meta rejected token"),
    );

    await expect(f.service.refreshExpiringTokens()).resolves.toEqual({
      refreshed: 0,
      failed: 1,
    });

    expect(f.prisma.igAccount.update).not.toHaveBeenCalled();
    expect(f.metrics.increment).not.toHaveBeenCalled();
  });
});
