import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type LEAD_SOURCE } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type DurationRow = {
  sample: bigint | number;
  withinSla: bigint | number;
  averageSeconds: number | null;
  medianSeconds: number | null;
};

type VelocityRow = {
  qualifiedSample: bigint | number;
  averageHoursToQualify: number | null;
  wonSample: bigint | number;
  averageDaysToWin: number | null;
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(workspaceId: string, days: number) {
    const generatedAt = new Date();
    const startsAt = new Date(generatedAt.getTime() - days * 86_400_000);
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { timezone: true, baseCurrency: true },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");

    const leadWindow = { workspaceId, createdAt: { gte: startsAt, lte: generatedAt } };

    const [
      created,
      qualified,
      booked,
      won,
      lost,
      open,
      flowRuns,
      automationFailures,
      sources,
      responseRows,
      velocityRows,
      googleBindings,
      openSheetConflicts,
      failedGoogleOperations,
    ] = await Promise.all([
      this.prisma.lead.count({ where: leadWindow }),
      this.prisma.lead.count({ where: { workspaceId, qualifiedAt: { gte: startsAt, lte: generatedAt } } }),
      this.prisma.leadMeeting.count({
        where: {
          workspaceId,
          createdAt: { gte: startsAt, lte: generatedAt },
          status: { in: ["CONFIRMED", "COMPLETED", "NO_SHOW"] },
        },
      }),
      this.prisma.lead.count({ where: { workspaceId, outcome: "WON", wonAt: { gte: startsAt, lte: generatedAt } } }),
      this.prisma.lead.count({ where: { workspaceId, outcome: "LOST", lostAt: { gte: startsAt, lte: generatedAt } } }),
      this.prisma.lead.count({ where: { workspaceId, recordState: "ACTIVE", outcome: "OPEN" } }),
      this.prisma.flowRun.count({ where: { workspaceId, startedAt: { gte: startsAt, lte: generatedAt } } }),
      this.prisma.flowRun.count({ where: { workspaceId, status: "FAILED", startedAt: { gte: startsAt, lte: generatedAt } } }),
      this.prisma.lead.groupBy({ by: ["source"], where: leadWindow, _count: { _all: true } }),
      this.responseSla(workspaceId, startsAt, generatedAt),
      this.velocity(workspaceId, startsAt, generatedAt),
      this.prisma.googleBinding.groupBy({ by: ["status"], where: { workspaceId }, _count: { _all: true } }),
      this.prisma.sheetSyncConflict.count({ where: { workspaceId, status: "OPEN" } }),
      this.prisma.integrationOperation.count({
        where: {
          workspaceId,
          status: { in: ["FAILED", "REAUTH_REQUIRED"] },
          updatedAt: { gte: startsAt, lte: generatedAt },
        },
      }),
    ]);

    const response = responseRows[0] ?? { sample: 0, withinSla: 0, averageSeconds: null, medianSeconds: null };
    const velocity = velocityRows[0] ?? { qualifiedSample: 0, averageHoursToQualify: null, wonSample: 0, averageDaysToWin: null };
    const responseSample = Number(response.sample);
    const withinSla = Number(response.withinSla);
    const bindingTotal = googleBindings.reduce((sum, row) => sum + row._count._all, 0);
    const bindingActive = googleBindings.find((row) => row.status === "ACTIVE")?._count._all ?? 0;

    const metric = (label: string, value: number, definition: string, denominator: number | null, denominatorLabel: string | null, drillThrough: string) => ({
      label,
      value,
      definition,
      denominator: denominator === null ? null : { value: denominator, label: denominatorLabel },
      drillThrough,
    });

    return {
      meta: {
        timezone: workspace.timezone,
        baseCurrency: workspace.baseCurrency,
        generatedAt: generatedAt.toISOString(),
        window: { days, startsAt: startsAt.toISOString(), endsAt: generatedAt.toISOString() },
        freshness: "Transactionally current as of generatedAt; Google provider state reflects the latest completed sync.",
      },
      funnel: {
        created: metric("Created", created, "Leads created in the selected window.", null, null, `/dashboard/${workspaceId}/leads`),
        qualified: metric("Qualified", qualified, "Leads first marked qualified in the selected window.", created, "created leads", `/dashboard/${workspaceId}/leads?stage=QUALIFIED`),
        booked: metric("Booked", booked, "Meetings confirmed, completed, or marked no-show and created in the selected window.", qualified, "qualified leads", `/dashboard/${workspaceId}/appointments`),
        won: metric("Won", won, "Leads moved to a Won stage in the selected window.", created, "created leads", `/dashboard/${workspaceId}/leads?outcome=WON`),
        lost: metric("Lost", lost, "Leads moved to a Lost stage in the selected window.", created, "created leads", `/dashboard/${workspaceId}/leads?outcome=LOST`),
      },
      responseSla: {
        targetMinutes: 15,
        sample: responseSample,
        withinTarget: withinSla,
        attainmentPercent: responseSample ? this.round((withinSla / responseSample) * 100) : null,
        averageMinutes: response.averageSeconds === null ? null : this.round(Number(response.averageSeconds) / 60),
        medianMinutes: response.medianSeconds === null ? null : this.round(Number(response.medianSeconds) / 60),
        definition: "Time from each inbound Instagram message to the next human-agent outbound message in the same conversation.",
        denominator: { value: responseSample, label: "inbound messages with an agent response" },
        drillThrough: `/dashboard/${workspaceId}/inbox`,
      },
      velocity: {
        averageHoursToQualify: velocity.averageHoursToQualify === null ? null : this.round(Number(velocity.averageHoursToQualify)),
        qualifiedSample: Number(velocity.qualifiedSample),
        averageDaysToWin: velocity.averageDaysToWin === null ? null : this.round(Number(velocity.averageDaysToWin)),
        wonSample: Number(velocity.wonSample),
        definition: "Average elapsed time from lead creation to qualification and Won outcome for milestones reached in the selected window.",
        drillThrough: `/dashboard/${workspaceId}/leads`,
      },
      firstTouchAttribution: sources
        .map((row) => ({ source: row.source as LEAD_SOURCE, leads: row._count._all, sharePercent: created ? this.round((row._count._all / created) * 100) : 0 }))
        .sort((a, b) => b.leads - a.leads),
      automation: {
        runs: flowRuns,
        failures: automationFailures,
        failureRatePercent: flowRuns ? this.round((automationFailures / flowRuns) * 100) : null,
        definition: "Failed immutable Flow runs divided by all Flow runs started in the selected window.",
        denominator: { value: flowRuns, label: "flow runs" },
        drillThrough: `/dashboard/${workspaceId}/automations`,
      },
      integrationHealth: {
        googleBindings: { total: bindingTotal, active: bindingActive, attention: bindingTotal - bindingActive },
        openSheetConflicts,
        failedOperations: failedGoogleOperations,
        definition: "Current Google binding health plus unresolved Sheet conflicts and failed/reauth-required operations in the selected window.",
        drillThrough: `/dashboard/${workspaceId}/integrations`,
      },
      openPipeline: {
        leads: open,
        definition: "Active leads currently in an open funnel category, independent of the selected creation window.",
        drillThrough: `/dashboard/${workspaceId}/leads`,
      },
    };
  }

  private responseSla(workspaceId: string, startsAt: Date, endsAt: Date) {
    return this.prisma.$queryRaw<DurationRow[]>(Prisma.sql`
      WITH response_times AS (
        SELECT EXTRACT(EPOCH FROM (response."createdAt" - inbound."createdAt")) AS seconds
        FROM "Message" inbound
        CROSS JOIN LATERAL (
          SELECT outbound."createdAt"
          FROM "Message" outbound
          WHERE outbound."workspaceId" = inbound."workspaceId"
            AND outbound."conversationId" = inbound."conversationId"
            AND outbound.direction = 'OUT'
            AND outbound.source = 'AGENT'
            AND outbound."createdAt" >= inbound."createdAt"
          ORDER BY outbound."createdAt" ASC
          LIMIT 1
        ) response
        WHERE inbound."workspaceId" = ${workspaceId}::uuid
          AND inbound.direction = 'IN'
          AND inbound."createdAt" >= ${startsAt}
          AND inbound."createdAt" <= ${endsAt}
      )
      SELECT COUNT(*) AS sample,
        COUNT(*) FILTER (WHERE seconds <= 900) AS "withinSla",
        AVG(seconds)::float8 AS "averageSeconds",
        percentile_cont(0.5) WITHIN GROUP (ORDER BY seconds)::float8 AS "medianSeconds"
      FROM response_times
    `);
  }

  private velocity(workspaceId: string, startsAt: Date, endsAt: Date) {
    return this.prisma.$queryRaw<VelocityRow[]>(Prisma.sql`
      SELECT
        COUNT(*) FILTER (WHERE "qualifiedAt" BETWEEN ${startsAt} AND ${endsAt}) AS "qualifiedSample",
        (AVG(EXTRACT(EPOCH FROM ("qualifiedAt" - "createdAt")) / 3600)
          FILTER (WHERE "qualifiedAt" BETWEEN ${startsAt} AND ${endsAt}))::float8 AS "averageHoursToQualify",
        COUNT(*) FILTER (WHERE "wonAt" BETWEEN ${startsAt} AND ${endsAt}) AS "wonSample",
        (AVG(EXTRACT(EPOCH FROM ("wonAt" - "createdAt")) / 86400)
          FILTER (WHERE "wonAt" BETWEEN ${startsAt} AND ${endsAt}))::float8 AS "averageDaysToWin"
      FROM "Lead"
      WHERE "workspaceId" = ${workspaceId}::uuid
    `);
  }

  private round(value: number): number {
    return Math.round(value * 10) / 10;
  }
}
