import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { QUEUES } from "@repo/shared";
import { FlowsController } from "./flows.controller";
import { FlowsService } from "./flows.service";
import { FlowExecutor } from "./flow-executor";
import { FlowRunsProcessor } from "./flow-runs.processor";
import { LeadsModule } from "../leads/leads.module";

const workerProviders = (process.env.APP_ROLE ?? "api") === "worker"
  ? [FlowExecutor, FlowRunsProcessor]
  : [];

@Module({
  imports: [
    LeadsModule,
    // FLOW_RUNS: consumed by FlowRunsProcessor + produced for delayed resumes.
    // SEND_MESSAGES: produced by the executor's send actions.
    BullModule.registerQueue(
      { name: QUEUES.FLOW_RUNS },
      { name: QUEUES.SEND_MESSAGES },
    ),
  ],
  controllers: [FlowsController],
  providers: [FlowsService, ...workerProviders],
})
export class FlowsModule {}
