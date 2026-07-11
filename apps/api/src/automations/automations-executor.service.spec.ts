import { AutomationsExecutorService } from "./automations-executor.service";

function makeFixture() {
  const prisma = {
    automation: { findMany: jest.fn() },
    listener: { update: jest.fn() },
    post: { deleteMany: jest.fn() },
  };
  const messaging = { createAndQueueSend: jest.fn().mockResolvedValue({ id: "msg-out" }) };
  const config = { get: jest.fn() };

  const service = new AutomationsExecutorService(
    prisma as never,
    messaging as never,
    config as never,
  );

  return { service, prisma, messaging, config };
}

describe("AutomationsExecutorService", () => {
  it("skips if no active automations found", async () => {
    const f = makeFixture();
    f.prisma.automation.findMany.mockResolvedValue([]);

    await f.service.trigger(
      { id: "iga-1", workspaceId: "ws-1", igUserId: "ig-biz" } as never,
      { id: "contact-1" } as never,
      { id: "conv-1" } as never,
      { id: "msg-in" } as never,
      { source: "dm", text: "hello" } as never,
    );

    expect(f.messaging.createAndQueueSend).not.toHaveBeenCalled();
  });

  it("processes matching comment triggers and sends DMs", async () => {
    const f = makeFixture();
    const automation = {
      id: "auto-1",
      trigger: [{ type: "COMMENT" }],
      keywords: [{ word: "promo" }],
      posts: [],
      listener: { id: "lis-1", listener: "MESSAGE", prompt: "Here is your code" },
    };
    f.prisma.automation.findMany.mockResolvedValue([automation]);

    await f.service.trigger(
      { id: "iga-1", workspaceId: "ws-1", igUserId: "ig-biz" } as never,
      { id: "contact-1" } as never,
      { id: "conv-1" } as never,
      { id: "msg-in" } as never,
      { source: "comment", text: "I want the promo code", postId: "post-1", commentId: "cmt-1" } as never,
    );

    expect(f.prisma.listener.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "lis-1" },
        data: expect.objectContaining({ commentCount: { increment: 1 } }),
      }),
    );

    expect(f.messaging.createAndQueueSend).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "Here is your code",
        replyToCommentId: "cmt-1",
      }),
    );
  });

  it("filters out non-matching keywords", async () => {
    const f = makeFixture();
    const automation = {
      id: "auto-1",
      trigger: [{ type: "DM" }],
      keywords: [{ word: "promo" }],
      posts: [],
      listener: { id: "lis-1", listener: "MESSAGE", prompt: "Here is your code" },
    };
    f.prisma.automation.findMany.mockResolvedValue([automation]);

    await f.service.trigger(
      { id: "iga-1", workspaceId: "ws-1", igUserId: "ig-biz" } as never,
      { id: "contact-1" } as never,
      { id: "conv-1" } as never,
      { id: "msg-in" } as never,
      { source: "dm", text: "just saying hello" } as never,
    );

    expect(f.messaging.createAndQueueSend).not.toHaveBeenCalled();
  });
});
