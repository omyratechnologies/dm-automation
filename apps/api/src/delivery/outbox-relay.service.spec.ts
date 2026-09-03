import type { OutboxEvent } from "@prisma/client";
import { OutboxRelayService } from "./outbox-relay.service";

const EVENT_ID = "0ece59e5-8495-401a-8a43-12bb0fce4d4e";
const MESSAGE_ID = "82609420-5db1-41f2-899d-d667fd47c8eb";

function event(): OutboxEvent {
  return {
    id: "2ba19af6-9090-48c6-9a70-cb5e1ea7fbac",
    eventId: EVENT_ID,
    type: "MessageQueued",
    version: 1,
    organizationId: "8db94a2b-2229-45ca-a70b-9eaecf11cc23",
    workspaceId: "886fec7c-d45e-4657-9e8a-a424cc5c8f30",
    aggregateType: "Message",
    aggregateId: MESSAGE_ID,
    aggregateVersion: 1,
    actorType: "USER",
    actorId: "34c64238-66e0-45bd-a870-136395bc35cc",
    correlationId: "correlation-1",
    causationId: null,
    payload: { messageId: MESSAGE_ID },
    occurredAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    availableAt: new Date(),
    publishedAt: null,
    status: "PENDING",
    attempts: 1,
    lastError: null,
  };
}

describe("OutboxRelayService MessageQueued", () => {
  it("hydrates sensitive send data from PostgreSQL and enqueues a deterministic job", async () => {
    const prisma = {
      message: {
        findFirst: jest.fn().mockResolvedValue({
          id: MESSAGE_ID,
          status: "QUEUED",
          source: "AGENT",
          text: "Choose your time: https://gemai.example/book/example#private",
          conversation: {
            igAccountId: "9dbd28af-bdf0-4998-863c-53a43e43c936",
            contactId: "0a658318-bb97-4094-bb07-ca218a57f8d4",
          },
        }),
      },
      outboxEvent: { update: jest.fn().mockResolvedValue({}) },
      sheetDestination: { findMany: jest.fn() },
    };
    const messageQueue = { add: jest.fn().mockResolvedValue({}) };
    const relay = new OutboxRelayService(
      prisma as never,
      { add: jest.fn() } as never,
      { add: jest.fn() } as never,
      messageQueue as never,
    );

    await (relay as unknown as { publish(value: OutboxEvent): Promise<void> }).publish(event());

    expect(prisma.message.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: MESSAGE_ID, workspaceId: "886fec7c-d45e-4657-9e8a-a424cc5c8f30" },
    }));
    expect(messageQueue.add).toHaveBeenCalledWith(
      "send",
      expect.objectContaining({ messageId: MESSAGE_ID, source: "AGENT", humanAgent: true }),
      { jobId: `send-messages:${EVENT_ID}` },
    );
    expect(prisma.outboxEvent.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "PUBLISHED" }),
    }));
  });

  it("does not send a message that already reached a terminal state", async () => {
    const prisma = {
      message: { findFirst: jest.fn().mockResolvedValue({ id: MESSAGE_ID, status: "SENT" }) },
      outboxEvent: { update: jest.fn().mockResolvedValue({}) },
      sheetDestination: { findMany: jest.fn() },
    };
    const messageQueue = { add: jest.fn() };
    const relay = new OutboxRelayService(
      prisma as never,
      { add: jest.fn() } as never,
      { add: jest.fn() } as never,
      messageQueue as never,
    );

    await (relay as unknown as { publish(value: OutboxEvent): Promise<void> }).publish(event());

    expect(messageQueue.add).not.toHaveBeenCalled();
    expect(prisma.outboxEvent.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "PUBLISHED" }),
    }));
  });
});
