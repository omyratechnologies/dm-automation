import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

/** Cross-process serialization for provider operations touching one spreadsheet. */
@Injectable()
export class SpreadsheetLockService {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(key: string, operation: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
      return operation();
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 120_000 });
  }
}
