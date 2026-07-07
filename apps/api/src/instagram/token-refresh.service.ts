import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { QUEUES } from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { IgGraphClient } from "./ig-graph.client";
import { TokenCrypto } from "../common/crypto/kms";

/**
 * Scans IgAccount records whose token is expiring within the next 7 days
 * and refreshes each one via the Meta refresh_access_token endpoint.
 * Called by a repeatable BullMQ job (daily).
 */
@Injectable()
export class TokenRefreshService implements OnModuleInit {
  private readonly logger = new Logger(TokenRefreshService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly graph: IgGraphClient,
    private readonly tokenCrypto: TokenCrypto,
    @InjectQueue(QUEUES.TOKEN_REFRESH)
    private readonly queue: Queue,
  ) {}

  async onModuleInit() {
    const jobs = await this.queue.getRepeatableJobs();
    if (jobs.length === 0) {
      await this.queue.add(
        "refresh-tokens",
        {},
        { repeat: { pattern: "0 3 * * *" }, removeOnComplete: { age: 86400 }, removeOnFail: { age: 86400 } },
      );
      this.logger.log("Scheduled daily token refresh job at 03:00 UTC");
    }
  }

  async refreshExpiringTokens(): Promise<{ refreshed: number; failed: number }> {
    const gracePeriod = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const accounts = await this.prisma.igAccount.findMany({
      where: {
        status: "ACTIVE",
        tokenExpiresAt: { lte: gracePeriod },
      },
      select: { id: true, tokenEncrypted: true },
    });

    let refreshed = 0;
    let failed = 0;

    for (const account of accounts) {
      try {
        const currentToken = this.tokenCrypto.decrypt(account.tokenEncrypted);
        const newToken = await this.graph.refreshLongLivedToken(currentToken);
        const ttlMs = newToken.expiresIn
          ? newToken.expiresIn * 1000
          : 60 * 24 * 60 * 60 * 1000;
        const tokenEncrypted = this.tokenCrypto.encrypt(newToken.accessToken);

        await this.prisma.igAccount.update({
          where: { id: account.id },
          data: {
            tokenEncrypted,
            tokenExpiresAt: new Date(Date.now() + ttlMs),
          },
        });
        refreshed++;
      } catch (err) {
        this.logger.warn(
          `Failed to refresh token for account ${account.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
        failed++;
      }
    }

    this.logger.log(`Token refresh: ${refreshed} refreshed, ${failed} failed`);
    return { refreshed, failed };
  }
}
