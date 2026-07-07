import { z } from "zod";

/**
 * Segment filter JSON — stored on Segment.filter and compiled to a Prisma
 * where-clause server-side. Conditions are ANDed together.
 */
export const segmentConditionSchema = z.discriminatedUnion("field", [
  z.object({
    field: z.literal("tag"),
    op: z.enum(["has", "not_has"]),
    value: z.string().min(1),
  }),
  z.object({
    field: z.literal("last_inbound"),
    op: z.enum(["within_hours", "older_than_hours"]),
    value: z.number().int().min(1).max(24 * 365),
  }),
  z.object({
    field: z.literal("username"),
    op: z.enum(["contains"]),
    value: z.string().min(1),
  }),
]);

export const segmentFilterSchema = z.object({
  conditions: z.array(segmentConditionSchema).max(20).default([]),
});

export type SegmentCondition = z.infer<typeof segmentConditionSchema>;
export type SegmentFilter = z.infer<typeof segmentFilterSchema>;
