import { AuditService } from "./audit.service";

describe("AuditService", () => {
  it("redacts PII and writes the audit plus outbox in one transaction", async () => {
    const auditCreate = jest.fn().mockResolvedValue({ id: "audit-1" });
    const outboxCreate = jest.fn().mockResolvedValue({ id: "event-1" });
    const tx = { auditLog: { create: auditCreate }, outboxEvent: { create: outboxCreate } };
    const prisma = { $transaction: jest.fn((run: (client: unknown) => unknown) => run(tx)) };
    const service = new AuditService(prisma as never);
    await service.log({ organizationId: "org-1", workspaceId: "workspace-1", action: "lead.updated", meta: { email: "person@example.com", version: 2 } });
    expect(auditCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ meta: { email: "[REDACTED]", version: 2 } }) });
    expect(outboxCreate).toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
