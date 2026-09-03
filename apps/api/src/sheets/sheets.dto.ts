import { z } from "zod";
import { sheetColumnMappingSchema } from "@repo/shared";

export const createSheetDestinationSchema = z.object({
  googleBindingId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  spreadsheetId: z.string().min(1).max(300),
  sheetId: z.number().int().nonnegative(),
  sheetTitle: z.string().min(1).max(200),
  pipelineId: z.string().uuid().optional(),
  initialAuthority: z.enum(["IMPORT", "EXPORT", "REVIEWED_MERGE"]),
});
export const replaceSheetMappingsSchema = z.object({ mappings: z.array(sheetColumnMappingSchema).min(1).max(200) });
export const resolveSheetConflictSchema = z.object({ resolution: z.enum(["APP", "SHEET", "MERGE"]), mergedValue: z.unknown().optional() });
export type CreateSheetDestinationDto = z.infer<typeof createSheetDestinationSchema>;
export type ReplaceSheetMappingsDto = z.infer<typeof replaceSheetMappingsSchema>;
export type ResolveSheetConflictDto = z.infer<typeof resolveSheetConflictSchema>;
