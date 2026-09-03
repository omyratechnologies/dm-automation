import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

@Injectable()
export class ProcessedEventService {
  async runOnce<T>(
    tx: Prisma.TransactionClient,
    consumer: string,
    eventId: string,
    mutation: () => Promise<T>,
  ): Promise<{ applied: boolean; value?: T }> {
    try {
      await tx.processedEvent.create({ data: { consumer, eventId } });
    } catch (error) {
      if ((error as { code?: string }).code === "P2002") return { applied: false };
      throw error;
    }
    return { applied: true, value: await mutation() };
  }
}
