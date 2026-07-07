import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { SegmentCondition, SegmentFilter } from "@repo/shared";

/**
 * Compiles a stored segment filter (see @repo/shared segmentFilterSchema)
 * into a Prisma Contact where-clause. Conditions are ANDed. The result is
 * always scoped to the workspace (and IG account when given) and excludes
 * opted-out contacts.
 */
@Injectable()
export class SegmentQueryService {
  compileFilter(
    workspaceId: string,
    igAccountId: string | null,
    filter: SegmentFilter,
  ): Prisma.ContactWhereInput {
    const conditions = filter.conditions.map((c) => this.compileCondition(c));
    return {
      workspaceId,
      ...(igAccountId ? { igAccountId } : {}),
      optedOutAt: null,
      ...(conditions.length ? { AND: conditions } : {}),
    };
  }

  private compileCondition(
    condition: SegmentCondition,
  ): Prisma.ContactWhereInput {
    switch (condition.field) {
      case "tag":
        return condition.op === "has"
          ? { tags: { has: condition.value } }
          : { NOT: { tags: { has: condition.value } } };
      case "last_inbound": {
        const boundary = new Date(
          Date.now() - condition.value * 60 * 60 * 1000,
        );
        return condition.op === "within_hours"
          ? { lastInboundAt: { gte: boundary } }
          : { lastInboundAt: { lt: boundary } };
      }
      case "username":
        return {
          username: { contains: condition.value, mode: "insensitive" },
        };
      default:
        throw new Error(`Unknown segment condition field: ${(condition as { field: string }).field}`);
    }
  }
}
