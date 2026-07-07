import { QUEUES } from "@repo/shared";
import { BroadcastsProcessor } from "./broadcasts.processor";

function makeFixture() {
  const prisma = {
    broadcast: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    contact: {
      findMany: jest.fn(),
    },
    conversation: {
      upsert: jest.fn(),
    },
    message: {
      create: jest.fn(),
    },
  };
  const segmentQuery = {
    compileFilter: jest.fn().mockReturnValue({ workspaceId: "ws-1" }),
  };
  const sendQueue = { add: jest.fn() };

  const processor = new BroadcastsProcessor(
    prisma as never,
    segmentQuery as never,
    sendQueue as never,
  );

  return { processor, prisma, segmentQuery, sendQueue };
}

describe("BroadcastsProcessor", () => {
  it("skips fan-out when broadcast is not QUEUED", async () => {
    const f = makeFixture();
    f.prisma.broadcast.findUnique.mockResolvedValue({ status: "CANCELED" });

    await f.processor.process({ data: { broadcastId: "bc-1" } } as never);

    expect(f.prisma.broadcast.update).not.toHaveBeenCalled();
  });

  it("fans out QUEUED broadcast and sets status to COMPLETED", async () => {
    const f = makeFixture();
    f.prisma.broadcast.findUnique
      .mockResolvedValueOnce({
        id: "bc-1",
        workspaceId: "ws-1",
        igAccountId: "iga-1",
        messageText: "flash sale!",
        status: "QUEUED",
        segment: null,
      })
      .mockResolvedValueOnce({ status: "SENDING" });
    f.prisma.contact.findMany.mockResolvedValue([
      { id: "c-1", lastInboundAt: new Date(), conversation: { id: "conv-1" } },
    ]);
    f.prisma.conversation.upsert.mockResolvedValue({ id: "conv-1" });
    f.prisma.message.create.mockResolvedValue({ id: "msg-1" });

    await f.processor.process({ data: { broadcastId: "bc-1" } } as never);

    expect(f.prisma.broadcast.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "SENDING" } }),
    );
    expect(f.sendQueue.add).toHaveBeenCalled();
    expect(f.prisma.broadcast.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "COMPLETED" } }),
    );
  });

  it("stops mid fan-out if broadcast is canceled", async () => {
    const f = makeFixture();
    f.prisma.broadcast.findUnique
      .mockResolvedValueOnce({
        id: "bc-1",
        workspaceId: "ws-1",
        igAccountId: "iga-1",
        messageText: "sale!",
        status: "QUEUED",
        segment: null,
      })
      .mockResolvedValue({ status: "CANCELED" });
    f.prisma.contact.findMany.mockResolvedValue([
      { id: "c-1", lastInboundAt: new Date(), conversation: { id: "conv-1" } },
    ]);

    await f.processor.process({ data: { broadcastId: "bc-1" } } as never);

    expect(f.sendQueue.add).not.toHaveBeenCalled();
  });

  it("skips contacts outside the 24h window", async () => {
    const f = makeFixture();
    f.prisma.broadcast.findUnique
      .mockResolvedValueOnce({
        id: "bc-1",
        workspaceId: "ws-1",
        igAccountId: "iga-1",
        messageText: "sale!",
        status: "QUEUED",
        segment: null,
      })
      .mockResolvedValueOnce({ status: "SENDING" });
    f.prisma.contact.findMany.mockResolvedValue([
      { id: "c-1", lastInboundAt: null, conversation: null },
    ]);

    await f.processor.process({ data: { broadcastId: "bc-1" } } as never);

    expect(f.sendQueue.add).not.toHaveBeenCalled();
    expect(f.prisma.broadcast.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { skippedCount: { increment: 1 } } }),
    );
  });
});
