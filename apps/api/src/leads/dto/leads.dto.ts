import { z } from "zod";

export const createLeadFieldSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_]+$/, "Key must be lowercase alphanumeric with underscores"),
  label: z.string().min(1).max(100),
  type: z.enum(["TEXT", "NUMBER", "BOOLEAN"]),
});

export type CreateLeadFieldDto = z.infer<typeof createLeadFieldSchema>;

export const updateLeadFieldValueSchema = z.object({
  fieldId: z.string().uuid(),
  value: z.string(),
});

export type UpdateLeadFieldValueDto = z.infer<typeof updateLeadFieldValueSchema>;

export const updateLeadSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "DISQUALIFIED"]).optional(),
  score: z.number().int().optional(),
  notes: z.string().max(1000).optional(),
});

export type UpdateLeadDto = z.infer<typeof updateLeadSchema>;
