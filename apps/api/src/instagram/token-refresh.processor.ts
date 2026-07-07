import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { QUEUES } from "@repo/shared";
import { TokenRefreshService } from "./token-refresh.service";

/**
 * Daily repeatable job that refreshes expiring IG access tokens
 * (60-day lifetime, refreshable for another 60 days).
 */
@Processor(QUEUES.TOKEN_REFRESH)
export class TokenRefreshProcessor extends WorkerHost {
  constructor(private readonly service: TokenRefreshService) {
    super();
  }

  async process(job: Job): Promise<{ refreshed: number; failed: number }> {
    return this.service.refreshExpiringTokens();
  }
}
