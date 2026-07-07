import { z } from "zod";
import { maxBytesRefine, maxBytesMessage } from "./validation";

/**
 * Flow definition JSON — the versioned trigger → condition → action graph.
 * Persisted on FlowVersion.definition and validated at the API boundary.
 */

export const triggerNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal("trigger"),
  data: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("keyword"),
      keywords: z.array(z.string().min(1)).min(1),
      matchType: z.enum(["exact", "contains"]).default("contains"),
    }),
    z.object({
      kind: z.literal("comment"),
      keywords: z.array(z.string().min(1)).min(1),
      matchType: z.enum(["exact", "contains"]).default("contains"),
      // empty = any post on the connected account
      postIds: z.array(z.string()).default([]),
    }),
    z.object({
      kind: z.literal("story_reply"),
      // empty keywords = capture every story reply
      keywords: z.array(z.string().min(1)).default([]),
      matchType: z.enum(["exact", "contains"]).default("contains"),
    }),
    z.object({ kind: z.literal("any_message") }),
  ]),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});

export const conditionNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal("condition"),
  data: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("text_matches"),
      keywords: z.array(z.string().min(1)).min(1),
      matchType: z.enum(["exact", "contains"]).default("contains"),
    }),
    z.object({ kind: z.literal("has_tag"), tag: z.string().min(1) }),
    // true when the contact is inside the 24h standard messaging window
    z.object({ kind: z.literal("within_window") }),
    // true when the contact follows the business IG account
    z.object({ kind: z.literal("has_follow") }),
  ]),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});

export const actionNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal("action"),
  data: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("send_message"),
      text: z.string().min(1).refine(maxBytesRefine(1000), maxBytesMessage(1000)),
      quickReplies: z.array(z.string().min(1).max(20)).max(13).default([]),
    }),
    z.object({
      kind: z.literal("ai_reply"),
      prompt: z.string().min(1).max(4000),
    }),
    z.object({ kind: z.literal("add_tag"), tag: z.string().min(1) }),
    z.object({ kind: z.literal("remove_tag"), tag: z.string().min(1) }),
    z.object({ kind: z.literal("handoff_human") }),
    z.object({
      kind: z.literal("wait"),
      seconds: z.number().int().min(1).max(86400),
    }),
  ]),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});

export const flowNodeSchema = z.union([
  triggerNodeSchema,
  conditionNodeSchema,
  actionNodeSchema,
]);

export const flowEdgeSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  // condition nodes branch on "true"/"false"; everything else uses "default"
  branch: z.enum(["default", "true", "false"]).default("default"),
});

export const flowDefinitionSchema = z
  .object({
    nodes: z.array(flowNodeSchema).min(1).max(100),
    edges: z.array(flowEdgeSchema).max(200),
  })
  .superRefine((def, ctx) => {
    const triggers = def.nodes.filter((n) => n.type === "trigger");
    if (triggers.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Flow must contain exactly one trigger node",
      });
    }
    const ids = new Set(def.nodes.map((n) => n.id));
    if (ids.size !== def.nodes.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Node ids must be unique",
      });
    }
    for (const e of def.edges) {
      if (!ids.has(e.from) || !ids.has(e.to)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Edge ${e.id} references unknown node`,
        });
      }
    }
  });

export type TriggerNode = z.infer<typeof triggerNodeSchema>;
export type ConditionNode = z.infer<typeof conditionNodeSchema>;
export type ActionNode = z.infer<typeof actionNodeSchema>;
export type FlowNode = z.infer<typeof flowNodeSchema>;
export type FlowEdge = z.infer<typeof flowEdgeSchema>;
export type FlowDefinition = z.infer<typeof flowDefinitionSchema>;
export type TriggerKind = TriggerNode["data"]["kind"];
