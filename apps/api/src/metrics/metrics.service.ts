import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";

const PREFIX = "metrics";

export const METRICS_KEYS = {
  MESSAGES_SENT: `${PREFIX}:messages:sent`,
  MESSAGES_FAILED: `${PREFIX}:messages:failed`,
  WEBHOOKS_RECEIVED: `${PREFIX}:webhooks:received`,
  WEBHOOKS_PROCESSED: `${PREFIX}:webhooks:processed`,
  BROADCASTS_SENT: `${PREFIX}:broadcasts:sent`,
  FLOW_RUNS_COMPLETED: `${PREFIX}:flows:completed`,
  TOKENS_REFRESHED: `${PREFIX}:tokens:refreshed`,
} as const;

export type MetricName = keyof typeof METRICS_KEYS;

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private redis: Redis | null = null;

  constructor(config: ConfigService) {
    const url = config.get<string>("REDIS_URL") ?? "redis://localhost:6379";
    if (process.env.NODE_ENV !== "test") {
      try {
        this.redis = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
        this.redis.connect().catch(() => {
          this.redis = null;
        });
      } catch {
        this.logger.warn("Metrics: Redis unavailable");
      }
    }
  }

  async increment(key: string): Promise<void> {
    if (!this.redis) return;
    try {
      const val = await this.redis.incr(key);
      if (val === 1) {
        await this.redis.expire(key, 90 * 86400);
      }
    } catch {
      /* swallow */
    }
  }

  async get(key: string): Promise<number> {
    if (!this.redis) return 0;
    try {
      const val = await this.redis.get(key);
      return val !== null ? Number(val) : 0;
    } catch {
      return 0;
    }
  }

  async getAll(): Promise<Record<string, number>> {
    if (!this.redis) return {};
    const entries: Array<[string, number]> = await Promise.all(
      (Object.keys(METRICS_KEYS) as MetricName[]).map(async (name) => {
        const val = await this.get(METRICS_KEYS[name]);
        return [name.toLowerCase(), val];
      }),
    );
    return Object.fromEntries(entries);
  }
}
