import { AnalyticsService } from "./analytics.service";

function fixture() {
  const prisma = {
    workspace: { findUnique: jest.fn().mockResolvedValue({ timezone: "Asia/Kolkata", baseCurrency: "INR" }) },
    lead: {
      count: jest.fn()
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(12),
      groupBy: jest.fn().mockResolvedValue([
        { source: "INSTAGRAM", _count: { _all: 15 } },
        { source: "API", _count: { _all: 5 } },
      ]),
    },
    leadMeeting: { count: jest.fn().mockResolvedValue(6) },
    flowRun: { count: jest.fn().mockResolvedValueOnce(40).mockResolvedValueOnce(2) },
    googleBinding: { groupBy: jest.fn().mockResolvedValue([{ status: "ACTIVE", _count: { _all: 2 } }, { status: "REAUTH_REQUIRED", _count: { _all: 1 } }]) },
    sheetSyncConflict: { count: jest.fn().mockResolvedValue(3) },
    integrationOperation: { count: jest.fn().mockResolvedValue(1) },
    $queryRaw: jest.fn()
      .mockResolvedValueOnce([{ sample: 8n, withinSla: 6n, averageSeconds: 720, medianSeconds: 600 }])
      .mockResolvedValueOnce([{ qualifiedSample: 10n, averageHoursToQualify: 12.5, wonSample: 4n, averageDaysToWin: 5.25 }]),
  };
  return { prisma, service: new AnalyticsService(prisma as never) };
}

describe("AnalyticsService", () => {
  it("returns source-backed funnel, SLA, velocity and health definitions", async () => {
    const { service, prisma } = fixture();
    const result = await service.overview("00000000-0000-0000-0000-000000000001", 30);

    expect(result.meta).toEqual(expect.objectContaining({ timezone: "Asia/Kolkata", baseCurrency: "INR" }));
    expect(result.funnel.created.value).toBe(20);
    expect(result.funnel.qualified.denominator).toEqual({ value: 20, label: "created leads" });
    expect(result.responseSla).toEqual(expect.objectContaining({ attainmentPercent: 75, averageMinutes: 12, medianMinutes: 10 }));
    expect(result.velocity).toEqual(expect.objectContaining({ averageHoursToQualify: 12.5, averageDaysToWin: 5.3 }));
    expect(result.firstTouchAttribution).toEqual([
      { source: "INSTAGRAM", leads: 15, sharePercent: 75 },
      { source: "API", leads: 5, sharePercent: 25 },
    ]);
    expect(result.integrationHealth.googleBindings).toEqual({ total: 3, active: 2, attention: 1 });

    for (const call of prisma.lead.count.mock.calls) expect(call[0].where.workspaceId).toBe("00000000-0000-0000-0000-000000000001");
  });
});
