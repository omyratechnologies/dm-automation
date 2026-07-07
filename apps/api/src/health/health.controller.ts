import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { ApiTags } from "@nestjs/swagger";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { QUEUES } from "@repo/shared";
import { Public } from "../auth/public.decorator";
import { IgGraphClient } from "../instagram/ig-graph.client";
import { PrismaService } from "../prisma/prisma.service";
import { MetricsService } from "../metrics/metrics.service";

@ApiTags("health")
@SkipThrottle()
@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly igGraph: IgGraphClient,
    private readonly metrics: MetricsService,
    @InjectQueue(QUEUES.SEND_MESSAGES) private readonly sendQueue: Queue,
  ) {}

  @Public()
  @Get()
  async live() {
    const metrics = await this.metrics.getAll();
    return { status: "ok", uptime: process.uptime(), metrics };
  }

  @Public()
  @Get("ready")
  async ready() {
    const checks: Record<string, "up" | "down"> = { db: "down", redis: "down", meta_api: "down" };
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.db = "up";
    } catch {
      /* reported below */
    }
    try {
      const client = (await this.sendQueue.client) as unknown as {
        ping(): Promise<string>;
      };
      await client.ping();
      checks.redis = "up";
    } catch {
      /* reported below */
    }
    try {
      await this.igGraph.ping();
      checks.meta_api = "up";
    } catch {
      /* reported below */
    }
    const healthy = Object.values(checks).every((s) => s === "up");
    if (!healthy) {
      throw new ServiceUnavailableException({ status: "degraded", checks });
    }
    return { status: "ok", checks };
  }
}
