import { QUEUES, WS_EVENTS } from "@repo/shared";
import { WebhookEventsProcessor } from "./webhook-events.processor";

function makeFixture() {
  const prisma = {
    webhookEvent: { findUnique: jest.fn(), update: jest.fn() },
    igAccount: { findUnique: jest.fn() },
    contact: { upsert: jest.fn(), update: jest.fn() },
    conversation: { upsert: jest.fn() },
    message: { create: jest.fn() },
    post: { findFirst: jest.fn().mockResolvedValue(null) },
  };
  const inbox = { emitToWorkspace: jest.fn() };
  const graph = { getUserProfile: jest.fn().mockResolvedValue({ isUserFollowBusiness: true }) };
  const tokenCrypto = { decrypt: jest.fn().mockReturnValue("mock-token") };
  const flowQueue = { add: jest.fn() };

  const processor = new WebhookEventsProcessor(
    prisma as never,
    inbox as never,
    graph as never,
    tokenCrypto as never,
    flowQueue as never,
  );

  return { processor, prisma, inbox, graph, tokenCrypto, flowQueue };
}

describe("WebhookEventsProcessor", () => {
  it("skips when event not found", async () => {
    const f = makeFixture();
    f.prisma.webhookEvent.findUnique.mockResolvedValue(null);

    await f.processor.process({ data: { webhookEventId: "evt-1" } } as never);

    expect(f.prisma.igAccount.findUnique).not.toHaveBeenCalled();
  });

  it("skips when event already processed", async () => {
    const f = makeFixture();
    f.prisma.webhookEvent.findUnique.mockResolvedValue({ status: "PROCESSED" });

    await f.processor.process({ data: { webhookEventId: "evt-1" } } as never);

    expect(f.prisma.igAccount.findUnique).not.toHaveBeenCalled();
  });

  it("processes a standard DM webhook event", async () => {
    const f = makeFixture();
    f.prisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt-1",
      status: "RECEIVED",
      payload: {
        id: "ig-biz",
        messaging: [
          {
            sender: { id: "ig-contact" },
            message: { mid: "mid-1", text: "hello there" },
          },
        ],
      },
    });
    f.prisma.igAccount.findUnique.mockResolvedValue({
      id: "iga-1",
      igUserId: "ig-biz",
      workspaceId: "ws-1",
      status: "ACTIVE",
    });
    f.prisma.contact.upsert.mockResolvedValue({
      id: "contact-1",
    });
    f.prisma.conversation.upsert.mockResolvedValue({
      id: "conv-1",
      mode: "BOT",
    });
    f.prisma.message.create.mockResolvedValue({ id: "msg-1" });

    await f.processor.process({ data: { webhookEventId: "evt-1" } } as never);

    expect(f.prisma.contact.upsert).toHaveBeenCalled();
    expect(f.prisma.message.create).toHaveBeenCalled();
    expect(f.flowQueue.add).toHaveBeenCalledWith(
      "trigger",
      expect.objectContaining({
        kind: "trigger",
        workspaceId: "ws-1",
      }),
    );
    expect(f.inbox.emitToWorkspace).toHaveBeenCalledWith(
      "ws-1",
      WS_EVENTS.MESSAGE_CREATED,
      expect.any(Object),
    );
    expect(f.prisma.webhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "evt-1" },
        data: expect.objectContaining({ status: "PROCESSED" }),
      }),
    );
  });

  it("skips DM echo (outbound messages)", async () => {
    const f = makeFixture();
    f.prisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt-2",
      status: "RECEIVED",
      payload: {
        id: "ig-biz",
        messaging: [
          {
            sender: { id: "ig-contact" },
            message: { mid: "mid-2", text: "echo", is_echo: true },
          },
        ],
      },
    });
    f.prisma.igAccount.findUnique.mockResolvedValue({
      id: "iga-1",
      igUserId: "ig-biz",
      status: "ACTIVE",
    });

    await f.processor.process({ data: { webhookEventId: "evt-2" } } as never);

    expect(f.prisma.message.create).not.toHaveBeenCalled();
  });

  it("skips self-sent DMs (sender === igAccount)", async () => {
    const f = makeFixture();
    f.prisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt-3",
      status: "RECEIVED",
      payload: {
        id: "ig-biz",
        messaging: [
          {
            sender: { id: "ig-biz" },
            message: { mid: "mid-3", text: "self" },
          },
        ],
      },
    });
    f.prisma.igAccount.findUnique.mockResolvedValue({
      id: "iga-1",
      igUserId: "ig-biz",
      status: "ACTIVE",
    });

    await f.processor.process({ data: { webhookEventId: "evt-3" } } as never);

    expect(f.prisma.message.create).not.toHaveBeenCalled();
  });

  it("processes a comment webhook event", async () => {
    const f = makeFixture();
    f.prisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt-4",
      status: "RECEIVED",
      payload: {
        id: "ig-biz",
        changes: [
          {
            field: "comments",
            value: {
              id: "cmt-1",
              text: "nice post!",
              from: { id: "ig-commenter", username: "fan1" },
              media: { id: "post-1" },
            },
          },
        ],
      },
    });
    f.prisma.igAccount.findUnique.mockResolvedValue({
      id: "iga-1",
      igUserId: "ig-biz",
      workspaceId: "ws-1",
      status: "ACTIVE",
    });
    f.prisma.contact.upsert.mockResolvedValue({ id: "contact-1" });
    f.prisma.conversation.upsert.mockResolvedValue({
      id: "conv-1",
      mode: "BOT",
    });
    f.prisma.message.create.mockResolvedValue({ id: "msg-1" });

    await f.processor.process({ data: { webhookEventId: "evt-4" } } as never);

    expect(f.prisma.contact.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ username: "fan1" }),
      }),
    );
    expect(f.flowQueue.add).toHaveBeenCalledWith(
      "trigger",
      expect.objectContaining({
        trigger: expect.objectContaining({
          source: "comment",
          postId: "post-1",
          commentId: "cmt-1",
        }),
      }),
    );
  });

  it("skips comment from self (self-commenting)", async () => {
    const f = makeFixture();
    f.prisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt-5",
      status: "RECEIVED",
      payload: {
        id: "ig-biz",
        changes: [
          {
            field: "comments",
            value: {
              id: "cmt-2",
              text: "nice!",
              from: { id: "ig-biz", username: "my_biz" },
            },
          },
        ],
      },
    });
    f.prisma.igAccount.findUnique.mockResolvedValue({
      id: "iga-1",
      igUserId: "ig-biz",
      status: "ACTIVE",
    });

    await f.processor.process({ data: { webhookEventId: "evt-5" } } as never);

    expect(f.prisma.message.create).not.toHaveBeenCalled();
  });

  it("skips disconnected IG accounts", async () => {
    const f = makeFixture();
    f.prisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt-6",
      status: "RECEIVED",
      payload: {
        id: "ig-biz",
        messaging: [
          {
            sender: { id: "ig-contact" },
            message: { mid: "mid-6", text: "hello" },
          },
        ],
      },
    });
    f.prisma.igAccount.findUnique.mockResolvedValue({
      id: "iga-1",
      igUserId: "ig-biz",
      status: "DISCONNECTED",
    });

    await f.processor.process({ data: { webhookEventId: "evt-6" } } as never);

    expect(f.prisma.message.create).not.toHaveBeenCalled();
  });

  it("handles duplicate igMessageId (P2002) gracefully", async () => {
    const f = makeFixture();
    f.prisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt-7",
      status: "RECEIVED",
      payload: {
        id: "ig-biz",
        messaging: [
          {
            sender: { id: "ig-contact" },
            message: { mid: "mid-dup", text: "duplicate" },
          },
        ],
      },
    });
    f.prisma.igAccount.findUnique.mockResolvedValue({
      id: "iga-1",
      igUserId: "ig-biz",
      workspaceId: "ws-1",
      status: "ACTIVE",
    });
    f.prisma.contact.upsert.mockResolvedValue({ id: "contact-1" });
    f.prisma.conversation.upsert.mockResolvedValue({
      id: "conv-1",
      mode: "BOT",
    });
    const p2002 = new Error("Unique constraint") as Error & { code: string };
    p2002.code = "P2002";
    f.prisma.message.create.mockRejectedValue(p2002);

    await f.processor.process({ data: { webhookEventId: "evt-7" } } as never);

    expect(f.prisma.webhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "PROCESSED" }),
      }),
    );
  });

  it("marks event FAILED on unexpected error", async () => {
    const f = makeFixture();
    f.prisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt-8",
      status: "RECEIVED",
      payload: { id: "ig-biz", messaging: [] },
    });
    f.prisma.igAccount.findUnique.mockRejectedValue(new Error("DB timeout"));

    await f.processor.process({ data: { webhookEventId: "evt-8" } } as never);

    expect(f.prisma.webhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "FAILED" }),
      }),
    );
  });
});
