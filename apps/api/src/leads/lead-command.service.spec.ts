import { HttpStatus } from "@nestjs/common";
import { LeadCommandService } from "./lead-command.service";
import { ProblemException } from "../common/problem-details";

function makeService(transaction: jest.Mock) {
  const prisma = { $transaction: transaction };
  return new LeadCommandService(prisma as never, {} as never, {} as never);
}

describe("LeadCommandService capture concurrency", () => {
  const input = {
    identity: { type: "EMAIL" as const, scopeKey: "", value: "ada@example.invalid" },
    source: "API" as const,
    attributes: {},
  };
  const actor = { actorType: "SYSTEM" as const, correlationId: "race-test" };

  it("retries a serializable transaction conflict and returns the winning lead", async () => {
    const transaction = jest.fn()
      .mockRejectedValueOnce({ code: "P2034" })
      .mockResolvedValueOnce({ id: "lead-1", captured: false });
    const service = makeService(transaction);

    await expect(service.capture("workspace-1", input, actor)).resolves.toEqual({ id: "lead-1", captured: false });
    expect(transaction).toHaveBeenCalledTimes(2);
  });

  it("returns a stable conflict after exhausting concurrent-write retries", async () => {
    const service = makeService(jest.fn().mockRejectedValue({ code: "P2034" }));

    try {
      await service.capture("workspace-1", input, actor);
      throw new Error("expected conflict");
    } catch (error) {
      expect(error).toBeInstanceOf(ProblemException);
      expect((error as ProblemException).getStatus()).toBe(HttpStatus.CONFLICT);
      expect((error as ProblemException).getResponse()).toMatchObject({ code: "IDENTITY_CONFLICT" });
    }
  });
});

describe("LeadCommandService AI guardrails", () => {
  function aiFixture(stage: Record<string, unknown>) {
    const lead = { id: "lead-1", workspaceId: "workspace-1", pipelineId: "pipeline-1", version: 1, outcome: "OPEN", ownerMembershipId: null };
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      lead: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(lead),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      leadStage: { findFirst: jest.fn().mockResolvedValue(stage) },
      leadAttributeValue: { count: jest.fn().mockResolvedValue(0), findUnique: jest.fn() },
      leadActivity: { findFirst: jest.fn().mockResolvedValue(null) },
      membership: { findFirst: jest.fn().mockResolvedValue({ id: "member-1" }) },
      decisionLog: { create: jest.fn().mockResolvedValue({}) },
      qualificationSession: { findFirst: jest.fn().mockResolvedValue({ id: "session-1" }), create: jest.fn(), update: jest.fn().mockResolvedValue({}) },
      workspace: { findUniqueOrThrow: jest.fn().mockResolvedValue({ organizationId: "org-1", aiPolicyVersion: 1 }) },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
    const outbox = { append: jest.fn().mockResolvedValue({}) };
    const service = new LeadCommandService(prisma as never, outbox as never, {} as never);
    jest.spyOn(service, "ensureLeadForContact").mockResolvedValue({ ...lead, captured: false } as never);
    return { service, tx };
  }

  const actor = { actorType: "AI" as const, correlationId: "ai-test" };
  const commandBase = { evidenceMessageIds: ["00000000-0000-4000-8000-000000000010"], rationale: "Explicit message evidence", strategyVersion: "qualification-v1" };

  it("does not move a lead to a terminal stage below 0.95 confidence", async () => {
    const f = aiFixture({ id: "stage-won", funnelCategory: "WON", requiredFieldKeys: [], lostReasonRequired: false });
    await f.service.applyAiCommands("workspace-1", "contact-1", [{ ...commandBase, kind: "MOVE_STAGE", stageId: "00000000-0000-4000-8000-000000000020", confidence: 0.94 }], actor);
    expect(f.tx.lead.updateMany).not.toHaveBeenCalled();
    expect(f.tx.decisionLog.create).toHaveBeenCalled();
  });

  it("applies a non-terminal stage decision at 0.90 with required fields present", async () => {
    const f = aiFixture({ id: "stage-qualified", funnelCategory: "QUALIFIED", requiredFieldKeys: [], lostReasonRequired: false });
    await f.service.applyAiCommands("workspace-1", "contact-1", [{ ...commandBase, kind: "MOVE_STAGE", stageId: "00000000-0000-4000-8000-000000000021", confidence: 0.9 }], actor);
    expect(f.tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(f.tx.lead.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ stageId: "stage-qualified", outcome: "OPEN" }) }));
  });

  it("does not overwrite a concurrent human lead mutation", async () => {
    const f = aiFixture({ id: "stage-qualified", funnelCategory: "QUALIFIED", requiredFieldKeys: [], lostReasonRequired: false });
    f.tx.lead.updateMany.mockResolvedValue({ count: 0 });

    const result = await f.service.applyAiCommands("workspace-1", "contact-1", [{ ...commandBase, kind: "MOVE_STAGE", stageId: "00000000-0000-4000-8000-000000000021", confidence: 0.9 }], actor);

    expect(result.applied).toEqual([]);
  });
});

describe("LeadCommandService Sheet canonical fields", () => {
  it("applies valid canonical values and creates inspectable conflicts for unknown fields", async () => {
    const lead = { id: "lead-1", workspaceId: "workspace-1", contactId: "contact-1", pipelineId: "pipeline-1", version: 1 };
    const tx = {
      lead: { findUnique: jest.fn().mockResolvedValue(lead), update: jest.fn().mockResolvedValue({ ...lead, score: 85, stageId: "stage-1", version: 2 }) },
      leadField: { findMany: jest.fn().mockResolvedValue([]) },
      leadAttributeValue: { count: jest.fn().mockResolvedValue(0), findUnique: jest.fn(), upsert: jest.fn() },
      leadStage: { findFirst: jest.fn().mockResolvedValue({ id: "stage-1", funnelCategory: "QUALIFIED", requiredFieldKeys: [], lostReasonRequired: false }) },
      membership: { findFirst: jest.fn() },
      contactIdentity: { findUnique: jest.fn(), upsert: jest.fn() },
      contact: { update: jest.fn() },
      sheetSyncConflict: { create: jest.fn().mockResolvedValue({}) },
      workspace: { findUniqueOrThrow: jest.fn().mockResolvedValue({ organizationId: "org-1" }) },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
    const outbox = { append: jest.fn().mockResolvedValue({}) };
    const service = new LeadCommandService(prisma as never, outbox as never, {} as never);

    const result = await service.applySheetAttributes("workspace-1", "lead-1", 1, "destination-1", { score: "85", stage: "Qualified", unknown_column: "unsafe" }, { actorType: "GOOGLE_SHEET", correlationId: "sheet-test" });

    expect(tx.lead.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ score: 85, outcome: "OPEN" }) }));
    expect(tx.sheetSyncConflict.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ fieldKey: "unknown_column" }) }));
    expect(result.conflicts).toContain("unknown_column");
  });
});
