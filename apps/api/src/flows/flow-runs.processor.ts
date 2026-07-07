import { Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Prisma } from "@prisma/client";
import { QUEUES } from "@repo/shared";
import type { FlowDefinition, FlowRunJob, TriggerNode } from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { FlowExecutor } from "./flow-executor";
import type { FlowRunContext } from "./flow-executor";
import { triggerMatches } from "./trigger-matcher";

/** Run-storm guard: suppress duplicate runs started within this window. */
export const RUN_STORM_WINDOW_MS = 5 * 60 * 1000;

type TriggerJob = Extract<FlowRunJob, { kind: "trigger" }>;
type ResumeJob = Extract<FlowRunJob, { kind: "resume" }>;

@Processor(QUEUES.FLOW_RUNS, { concurrency: 3 })
export class FlowRunsProcessor extends WorkerHost {
  private readonly logger = new Logger(FlowRunsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly executor: FlowExecutor,
  ) {
    super();
  }

  async process(job: Job<FlowRunJob>): Promise<void> {
    try {
      const data = job.data;
      if (data.kind === "trigger") {
        await this.handleTrigger(data);
      } else {
        await this.handleResume(data);
      }
    } catch (err) {
      this.logger.error(
        `flow-run ${job.id}/${job.data.kind} failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }

  /**
   * Match the inbound event against the workspace's ACTIVE flows. First
   * matching flow wins, deterministically ordered by createdAt (oldest first).
   */
  private async handleTrigger(data: TriggerJob): Promise<void> {
    const flows = await this.prisma.flow.findMany({
      where: {
        workspaceId: data.workspaceId,
        status: "ACTIVE",
        activeVersionId: { not: null },
      },
      include: { activeVersion: true },
      orderBy: { createdAt: "asc" },
    });

    for (const flow of flows) {
      if (!flow.activeVersion) continue;
      const definition = flow.activeVersion
        .definition as unknown as FlowDefinition;
      const trigger = definition.nodes?.find(
        (n): n is TriggerNode => n.type === "trigger",
      );
      if (!trigger) continue;
      if (!triggerMatches(trigger.data, data.trigger)) continue;

      // Run-storm guard: don't start a duplicate run for the same
      // (flow, contact) while a recent one is still in flight.
      const recent = await this.prisma.flowRun.findFirst({
        where: {
          flowId: flow.id,
          contactId: data.contactId,
          status: { in: ["RUNNING", "WAITING"] },
          startedAt: { gte: new Date(Date.now() - RUN_STORM_WINDOW_MS) },
        },
        select: { id: true },
      });
      if (recent) {
        this.logger.warn(
          `run-storm guard: skipping flow ${flow.id} for contact ${data.contactId} (run ${recent.id} in flight)`,
        );
        return;
      }

      const context: FlowRunContext = { trigger: data.trigger };
      const run = await this.prisma.flowRun.create({
        data: {
          workspaceId: data.workspaceId,
          flowId: flow.id,
          flowVersionId: flow.activeVersion.id,
          contactId: data.contactId,
          status: "RUNNING",
          currentNodeId: trigger.id,
          context: context as unknown as Prisma.InputJsonValue,
        },
      });
      await this.executor.execute(
        {
          id: run.id,
          workspaceId: data.workspaceId,
          flowId: flow.id,
          contactId: data.contactId,
          context,
        },
        definition,
        trigger.id,
      );
      return; // first matching flow wins
    }
  }

  private async handleResume(data: ResumeJob): Promise<void> {
    const run = await this.prisma.flowRun.findUnique({
      where: { id: data.flowRunId },
      include: { flowVersion: true },
    });
    if (!run || run.status !== "WAITING" || !run.currentNodeId) {
      this.logger.warn(
        `resume skipped for run ${data.flowRunId}: missing or not WAITING`,
      );
      return;
    }
    await this.prisma.flowRun.update({
      where: { id: run.id },
      data: { status: "RUNNING" },
    });
    const definition = run.flowVersion.definition as unknown as FlowDefinition;
    await this.executor.execute(
      {
        id: run.id,
        workspaceId: run.workspaceId,
        flowId: run.flowId,
        contactId: run.contactId,
        context: (run.context ?? {}) as FlowRunContext,
      },
      definition,
      run.currentNodeId,
    );
  }
}
