import { UnrecoverableError } from "bullmq";
import { SEND_REJECTIONS } from "@repo/shared";
import type { SendMessageJob } from "@repo/shared";
import { IgApiError, RateLimitedError } from "../instagram/errors";
import { SendProcessor, currentPeriod } from "./send.processor";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

interface Fixture {
  processor: SendProcessor;
  prisma: {
    message: { findUnique: jest.Mock; update: jest.Mock };
    contact: { findUnique: jest.Mock; update: jest.Mock };
    igAccount: { findUnique: jest.Mock };
    conversation: { update: jest.Mock };
    usageCounter: { findUnique: jest.Mock; upsert: jest.Mock };
    broadcast: { update: jest.Mock };
  };
  graph: { sendDm: jest.Mock; privateReplyToComment: jest.Mock };
  inbox: { emitToWorkspace: jest.Mock };
  rateLimiter: { canSend: jest.Mock; recordSend: jest.Mock };
}

function makeFixture(opts: {
  lastInboundAt?: Date | null;
  usageSends?: number;
  plan?: "FREE" | "PRO";
  messageStatus?: string;
} = {}): Fixture {
  const message = {
    id: "msg-1",
    status: opts.messageStatus ?? "QUEUED",
    conversationId: "conv-1",
    workspaceId: "ws-1",
  };
  const contact = {
    id: "contact-1",
    igUserId: "ig-contact",
    lastInboundAt:
      opts.lastInboundAt === undefined ? new Date() : opts.lastInboundAt,
  };
  const igAccount = {
    id: "iga-1",
    igUserId: "ig-biz",
    status: "ACTIVE",
    tokenEncrypted: "v1.enc",
    workspace: {
      organization: { id: "org-1", plan: opts.plan ?? "FREE" },
    },
  };

  const prisma = {
    message: {
      findUnique: jest.fn().mockResolvedValue(message),
      update: jest
        .fn()
        .mockImplementation(({ data }) =>
          Promise.resolve({ ...message, ...data }),
        ),
    },
    contact: {
      findUnique: jest.fn().mockResolvedValue(contact),
      update: jest.fn().mockResolvedValue(contact),
    },
    igAccount: { findUnique: jest.fn().mockResolvedValue(igAccount) },
    conversation: { update: jest.fn().mockResolvedValue({}) },
    usageCounter: {
      findUnique: jest
        .fn()
        .mockResolvedValue(
          opts.usageSends === undefined ? null : { sends: opts.usageSends },
        ),
      upsert: jest.fn().mockResolvedValue({}),
    },
    broadcast: { update: jest.fn().mockResolvedValue({}) },
  };
  const graph = {
    sendDm: jest.fn().mockResolvedValue({ messageId: "ig-mid-1" }),
    privateReplyToComment: jest.fn().mockResolvedValue({ messageId: "ig-mid-2" }),
  };
  const tokenCrypto = { decrypt: jest.fn().mockReturnValue("plain-token") };
  const inbox = { emitToWorkspace: jest.fn() };
  const rateLimiter = {
    canSend: jest.fn().mockResolvedValue(true),
    recordSend: jest.fn().mockResolvedValue(1),
  };

  const processor = new SendProcessor(
    prisma as never,
    graph as never,
    tokenCrypto as never,
    inbox as never,
    rateLimiter as never,
  );
  return { processor, prisma, graph, inbox, rateLimiter };
}

function makeJob(overrides: Partial<SendMessageJob> = {}) {
  const data: SendMessageJob = {
    workspaceId: "ws-1",
    igAccountId: "iga-1",
    contactId: "contact-1",
    messageId: "msg-1",
    text: "hello",
    source: "AGENT",
    ...overrides,
  };
  return { data } as never;
}

function lastMessageUpdate(prisma: Fixture["prisma"]) {
  const calls = prisma.message.update.mock.calls;
  return calls[calls.length - 1][0].data;
}

describe("SendProcessor messaging-window / plan enforcement", () => {
  it("sends without the HUMAN_AGENT tag inside the 24h window", async () => {
    const f = makeFixture({ lastInboundAt: new Date(Date.now() - HOUR) });
    await f.processor.process(makeJob());

    expect(f.graph.sendDm).toHaveBeenCalledWith(
      "ig-biz",
      "ig-contact",
      "hello",
      "plain-token",
      expect.objectContaining({ humanAgent: false }),
    );
    expect(lastMessageUpdate(f.prisma)).toMatchObject({
      status: "SENT",
      igMessageId: "ig-mid-1",
      humanAgentTag: false,
    });
    expect(f.prisma.usageCounter.upsert).toHaveBeenCalled();
    expect(f.prisma.contact.update).toHaveBeenCalled();
    expect(f.inbox.emitToWorkspace).toHaveBeenCalled();
  });

  it("sends with the HUMAN_AGENT tag when window expired but humanAgent within 7 days", async () => {
    const f = makeFixture({ lastInboundAt: new Date(Date.now() - 2 * DAY) });
    await f.processor.process(makeJob({ humanAgent: true }));

    expect(f.graph.sendDm).toHaveBeenCalledWith(
      "ig-biz",
      "ig-contact",
      "hello",
      "plain-token",
      expect.objectContaining({ humanAgent: true }),
    );
    expect(lastMessageUpdate(f.prisma)).toMatchObject({
      status: "SENT",
      humanAgentTag: true,
    });
  });

  it("rejects HUMAN_AGENT sends beyond the 7-day window", async () => {
    const f = makeFixture({ lastInboundAt: new Date(Date.now() - 8 * DAY) });
    await f.processor.process(makeJob({ humanAgent: true }));

    expect(f.graph.sendDm).not.toHaveBeenCalled();
    expect(lastMessageUpdate(f.prisma)).toMatchObject({
      status: "REJECTED",
      errorCode: SEND_REJECTIONS.HUMAN_AGENT_WINDOW_EXPIRED,
    });
  });

  it("rejects non-humanAgent sends outside the 24h window", async () => {
    const f = makeFixture({ lastInboundAt: new Date(Date.now() - 25 * HOUR) });
    await f.processor.process(makeJob());

    expect(f.graph.sendDm).not.toHaveBeenCalled();
    expect(lastMessageUpdate(f.prisma)).toMatchObject({
      status: "REJECTED",
      errorCode: SEND_REJECTIONS.WINDOW_EXPIRED,
    });
  });

  it("rejects when the contact has no prior inbound message", async () => {
    const f = makeFixture({ lastInboundAt: null });
    await f.processor.process(makeJob({ humanAgent: true }));

    expect(f.graph.sendDm).not.toHaveBeenCalled();
    expect(lastMessageUpdate(f.prisma)).toMatchObject({
      status: "REJECTED",
      errorCode: SEND_REJECTIONS.NO_CONSENT,
    });
  });

  it("rejects when the plan send limit is reached", async () => {
    // FREE plan: 500 monthly sends.
    const f = makeFixture({ usageSends: 500, plan: "FREE" });
    await f.processor.process(makeJob());

    expect(f.graph.sendDm).not.toHaveBeenCalled();
    expect(lastMessageUpdate(f.prisma)).toMatchObject({
      status: "REJECTED",
      errorCode: SEND_REJECTIONS.PLAN_LIMIT,
    });
  });

  it("increments broadcast skippedCount on rejection", async () => {
    const f = makeFixture({ lastInboundAt: null });
    await f.processor.process(makeJob({ broadcastId: "bc-1" }));

    expect(f.prisma.broadcast.update).toHaveBeenCalledWith({
      where: { id: "bc-1" },
      data: { skippedCount: { increment: 1 } },
    });
  });

  it("rethrows RateLimitedError so BullMQ retries with backoff", async () => {
    const f = makeFixture();
    f.graph.sendDm.mockRejectedValueOnce(new RateLimitedError("throttled", 4));

    await expect(f.processor.process(makeJob())).rejects.toBeInstanceOf(
      RateLimitedError,
    );
    // The message stays QUEUED for the retry.
    expect(f.prisma.message.update).not.toHaveBeenCalled();
  });

  it("marks the message FAILED and throws UnrecoverableError on other 4xx", async () => {
    const f = makeFixture();
    f.graph.sendDm.mockRejectedValueOnce(
      new IgApiError("bad request", 400, 100),
    );

    await expect(f.processor.process(makeJob({ broadcastId: "bc-1" }))).rejects.toBeInstanceOf(
      UnrecoverableError,
    );
    expect(lastMessageUpdate(f.prisma)).toMatchObject({
      status: "FAILED",
      errorCode: "IG_100",
    });
    expect(f.prisma.broadcast.update).toHaveBeenCalledWith({
      where: { id: "bc-1" },
      data: { failedCount: { increment: 1 } },
    });
  });

  it("does nothing when the message is no longer QUEUED", async () => {
    const f = makeFixture({ messageStatus: "SENT" });
    await f.processor.process(makeJob());

    expect(f.graph.sendDm).not.toHaveBeenCalled();
    expect(f.prisma.message.update).not.toHaveBeenCalled();
  });

  it("uses privateReplyToComment when replyToCommentId is set", async () => {
    const f = makeFixture();
    await f.processor.process(makeJob({ replyToCommentId: "comment-9" }));

    expect(f.graph.privateReplyToComment).toHaveBeenCalledWith(
      "ig-biz",
      "comment-9",
      "hello",
      "plain-token",
    );
    expect(f.graph.sendDm).not.toHaveBeenCalled();
  });
});

describe("currentPeriod", () => {
  it("formats YYYY-MM in UTC", () => {
    expect(currentPeriod(new Date(Date.UTC(2026, 6, 4)))).toBe("2026-07");
    expect(currentPeriod(new Date(Date.UTC(2025, 11, 31, 23, 59)))).toBe(
      "2025-12",
    );
  });
});
