import { ConflictException, NotFoundException } from "@nestjs/common";
import { LeadsService } from "./leads.service";

function makeFixture() {
  const prisma = {
    leadField: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), upsert: jest.fn() },
    lead: { findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn(), upsert: jest.fn() },
    leadFieldValue: { upsert: jest.fn() },
  };

  const service = new LeadsService(prisma as never);

  return { service, prisma };
}

describe("LeadsService", () => {
  it("seeds default fields on call", async () => {
    const f = makeFixture();
    await f.service.seedDefaultFields("ws-1");

    // Default fields: email, phone, budget
    expect(f.prisma.leadField.upsert).toHaveBeenCalledTimes(3);
  });

  it("lists lead fields and seeds defaults first", async () => {
    const f = makeFixture();
    f.prisma.leadField.findMany.mockResolvedValue([{ key: "email" }] as any);

    const fields = await f.service.listLeadFields("ws-1");

    expect(f.prisma.leadField.upsert).toHaveBeenCalledTimes(3);
    expect(fields).toEqual([{ key: "email" }]);
  });

  it("creates lead field if key does not exist", async () => {
    const f = makeFixture();
    f.prisma.leadField.findUnique.mockResolvedValue(null);
    f.prisma.leadField.create.mockResolvedValue({ key: "custom" } as any);

    const result = await f.service.createLeadField("ws-1", {
      key: "custom",
      label: "Custom Label",
      type: "TEXT",
    });

    expect(result.key).toBe("custom");
  });

  it("throws conflict exception if custom field key already exists", async () => {
    const f = makeFixture();
    f.prisma.leadField.findUnique.mockResolvedValue({ key: "custom" } as any);

    await expect(
      f.service.createLeadField("ws-1", {
        key: "custom",
        label: "Custom Label",
        type: "TEXT",
      })
    ).rejects.toThrow(ConflictException);
  });

  it("updates lead status and sets timestamps", async () => {
    const f = makeFixture();
    const mockLead = { id: "lead-1", qualifiedAt: null, disqualifiedAt: null };
    f.prisma.lead.findFirst.mockResolvedValue(mockLead as any);
    f.prisma.lead.update.mockResolvedValue({ id: "lead-1", status: "QUALIFIED" } as any);

    const result = await f.service.updateLead("lead-1", "ws-1", {
      status: "QUALIFIED",
    });

    expect(f.prisma.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "lead-1" },
        data: expect.objectContaining({
          status: "QUALIFIED",
          qualifiedAt: expect.any(Date),
        }),
      })
    );
    expect(result.status).toBe("QUALIFIED");
  });
});
