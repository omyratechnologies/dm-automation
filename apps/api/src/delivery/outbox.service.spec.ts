import { OutboxService } from "./outbox.service";

describe("OutboxService", () => {
  const base = {
    type: "LeadUpdated",
    organizationId: "org-1",
    workspaceId: "workspace-1",
    aggregateType: "Lead",
    aggregateId: "lead-1",
    aggregateVersion: 2,
    correlationId: "correlation-1",
  };

  it("writes the enterprise envelope through the caller transaction", async () => {
    const create = jest.fn().mockResolvedValue({ id: "outbox-1" });
    const service = new OutboxService();
    await service.append({ outboxEvent: { create } } as never, { ...base, payload: { leadId: "lead-1", leadVersion: 2 } });
    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ type: "LeadUpdated", aggregateVersion: 2, payload: { leadId: "lead-1", leadVersion: 2 } }) });
  });

  it("rejects message text and exported values from event payloads", async () => {
    const service = new OutboxService();
    await expect(service.append({ outboxEvent: { create: jest.fn() } } as never, { ...base, payload: { messageText: "sensitive DM" } })).rejects.toThrow(/identifier-only/);
  });
});
