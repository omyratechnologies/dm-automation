import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { ACTOR_TYPE, type Prisma } from "@prisma/client";

export interface OutboxEventInput {
  type: string;
  organizationId: string;
  workspaceId: string;
  aggregateType: string;
  aggregateId: string;
  aggregateVersion: number;
  actorType?: ACTOR_TYPE;
  actorId?: string;
  correlationId: string;
  causationId?: string;
  /** Identifiers/revisions only. Never place PII, tokens or message content here. */
  payload?: Prisma.InputJsonObject;
}

@Injectable()
export class OutboxService {
  async append(tx: Prisma.TransactionClient, input: OutboxEventInput) {
    this.assertSafePayload(input.payload ?? {});
    return tx.outboxEvent.create({
      data: {
        eventId: randomUUID(),
        type: input.type,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        aggregateVersion: input.aggregateVersion,
        actorType: input.actorType ?? "SYSTEM",
        actorId: input.actorId,
        correlationId: input.correlationId,
        causationId: input.causationId,
        payload: input.payload ?? {},
      },
    });
  }

  private assertSafePayload(payload: Prisma.InputJsonObject): void {
    for (const [key, value] of Object.entries(payload)) {
      if (!/(Id|Version)$/.test(key) && !["source", "action"].includes(key)) throw new Error(`Outbox payload field is not identifier-only: ${key}`);
      if (value !== null && !["string", "number", "boolean"].includes(typeof value)) throw new Error(`Outbox payload field must be scalar: ${key}`);
      if (typeof value === "string" && value.length > 200) throw new Error(`Outbox payload field is too long: ${key}`);
    }
  }
}
