import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";

/** Hard cap from Meta: 200 automated DMs per hour per IG account. */
const MAX_SENDS_PER_HOUR = 200;

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private redis: Redis | null = null;

  constructor(config: ConfigService) {
    const url = config.get<string>("REDIS_URL") ?? "redis://localhost:6379";
    if (process.env.NODE_ENV !== "test") {
      try {
        this.redis = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
        this.redis.connect().catch(() => {
          this.logger.warn("Rate limiter: Redis unavailable");
          this.redis = null;
        });
      } catch {
        this.logger.warn("Rate limiter: Redis unavailable");
      }
    }
  }

  /** Check if we can send another DM for this IG account this hour. */
  async canSend(igAccountId: string): Promise<boolean> {
    if (!this.redis) return true;
    const key = `ratelimit:ig:${igAccountId}`;
    const count = await this.redis.get(key);
    if (count !== null && Number(count) >= MAX_SENDS_PER_HOUR) return false;
    return true;
  }

  /** Record a send attempt for this IG account. Returns the current count. */
  async recordSend(igAccountId: string): Promise<number> {
    if (!this.redis) return 0;
    const key = `ratelimit:ig:${igAccountId}`;
    const count = await this.redis.incr(key);
    // NX: only set when the key has no TTL yet. Covers both the first incr and
    // a key left TTL-less by a crash between incr and expire (which would
    // otherwise rate-limit the account forever).
    await this.redis.expire(key, 3600, "NX");
    return count;
  }
}
