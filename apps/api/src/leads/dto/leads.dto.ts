import { z } from "zod";
import { leadCaptureInputSchema } from "@repo/shared";

export const createManualLeadSchema = leadCaptureInputSchema.omit({ source: true }).extend({ sourceDetail: z.record(z.unknown()).optional() });
export type CreateManualLeadDto = z.infer<typeof createManualLeadSchema>;

export const createLeadFieldSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_]+$/, "Key must be lowercase alphanumeric with underscores"),
  label: z.string().min(1).max(100),
  type: z.enum(["TEXT", "NUMBER", "BOOLEAN", "DATE", "DATETIME", "EMAIL", "PHONE", "URL", "SELECT", "MULTI_SELECT", "CURRENCY"]),
  required: z.boolean().optional(),
  classification: z.enum(["INTERNAL", "CONFIDENTIAL", "SENSITIVE"]).optional(),
  sheetExportPolicy: z.enum(["DENY", "ADMIN_OPT_IN", "ALLOW"]).optional(),
  aiWritable: z.boolean().optional(),
});

export type CreateLeadFieldDto = z.infer<typeof createLeadFieldSchema>;

export const updateLeadFieldValueSchema = z.object({
  fieldId: z.string().uuid(),
  value: z.string(),
});

export type UpdateLeadFieldValueDto = z.infer<typeof updateLeadFieldValueSchema>;

export const updateLeadSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "DISQUALIFIED"]).optional(),
  score: z.number().int().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  ownerMembershipId: z.string().uuid().nullable().optional(),
  nextActionAt: z.string().datetime().nullable().optional(),
  expectedCloseAt: z.string().datetime().nullable().optional(),
});

export type UpdateLeadDto = z.infer<typeof updateLeadSchema>;

export const transitionLeadSchema = z.object({
  stageId: z.string().uuid(),
  lostReason: z.string().trim().min(1).max(500).optional(),
  reopen: z.boolean().default(false),
});
export type TransitionLeadDto = z.infer<typeof transitionLeadSchema>;

export const assignLeadSchema = z.object({ membershipId: z.string().uuid().nullable() });
export type AssignLeadDto = z.infer<typeof assignLeadSchema>;

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  dueAt: z.string().datetime().optional(),
  assigneeMembershipId: z.string().uuid().optional(),
});
export type CreateTaskDto = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({ status: z.enum(["COMPLETED", "CANCELED"]) });
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;

export const mergeLeadSchema = z.object({ targetLeadId: z.string().uuid() });
export type MergeLeadDto = z.infer<typeof mergeLeadSchema>;

export const createSavedViewSchema = z.object({
  name: z.string().trim().min(1).max(120),
  isShared: z.boolean().default(false),
  filters: z.record(z.unknown()),
  sort: z.record(z.unknown()).optional(),
  columns: z.array(z.string().min(1).max(100)).max(100).optional(),
});
export type CreateSavedViewDto = z.infer<typeof createSavedViewSchema>;

export const createPipelineSchema = z.object({ name: z.string().trim().min(1).max(120), description: z.string().trim().max(500).optional(), isDefault: z.boolean().default(false) });
export const createStageSchema = z.object({ name: z.string().trim().min(1).max(120), funnelCategory: z.enum(["NEW", "ENGAGING", "QUALIFIED", "MEETING_BOOKED", "PROPOSAL", "WON", "LOST", "CUSTOM"]), position: z.number().int().min(0).max(1000), probability: z.number().int().min(0).max(100), color: z.string().trim().min(1).max(40).default("slate"), lostReasonRequired: z.boolean().default(false), requiredFieldKeys: z.array(z.string().min(1).max(50)).max(50).default([]) });
export type CreatePipelineDto = z.infer<typeof createPipelineSchema>;
export type CreateStageDto = z.infer<typeof createStageSchema>;

export const bulkLeadCommandSchema = z.object({
  leads: z.array(z.object({ id: z.string().uuid(), version: z.number().int().positive() })).min(1).max(100),
  command: z.discriminatedUnion("type", [
    z.object({ type: z.literal("ARCHIVE") }),
    z.object({ type: z.literal("ASSIGN"), membershipId: z.string().uuid().nullable() }),
    z.object({ type: z.literal("MOVE_STAGE"), stageId: z.string().uuid() }),
  ]),
});
export type BulkLeadCommandDto = z.infer<typeof bulkLeadCommandSchema>;
