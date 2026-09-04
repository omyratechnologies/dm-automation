import { z } from "zod";

export const stableErrorCodes = [
  "WORKSPACE_FORBIDDEN",
  "VERSION_CONFLICT",
  "IDENTITY_CONFLICT",
  "INVALID_LEAD_TRANSITION",
  "SHEET_SCHEMA_DRIFT",
  "SHEET_SYNC_CONFLICT",
  "SLOT_UNAVAILABLE",
  "BOOKING_TOKEN_EXPIRED",
  "BOOKING_RESOURCE_NOT_FOUND",
  "CONVERSATION_NOT_FOUND",
  "MEETING_INVITATION_LEAD_INVALID",
  "MEETING_TYPE_UNAVAILABLE",
  "MESSAGING_WINDOW_EXPIRED",
  "GOOGLE_REAUTH_REQUIRED",
  "GOOGLE_SCOPE_MISSING",
  "GOOGLE_RATE_LIMITED",
  "GOOGLE_UNAVAILABLE",
  "GOOGLE_ACCOUNT_INVALID",
  "GOOGLE_BINDING_INVALID",
  "GOOGLE_BINDING_NOT_FOUND",
  "GOOGLE_ACCESS_DENIED",
  "GOOGLE_OAUTH_RESPONSE_INVALID",
  "OAUTH_STATE_INVALID",
  "OAUTH_STATE_REPLAYED",
  "IDEMPOTENCY_KEY_REQUIRED",
  "IDEMPOTENCY_KEY_REUSED",
  "IDEMPOTENCY_REQUEST_IN_PROGRESS",
  "PRECONDITION_REQUIRED",
  "FEATURE_DISABLED",
  "VALIDATION_FAILED",
  "INTERNAL_ERROR",
] as const;
export type StableErrorCode = (typeof stableErrorCodes)[number];

export const domainEventTypes = [
  "LeadCaptured",
  "LeadUpdated",
  "LeadStageChanged",
  "LeadAssigned",
  "LeadScored",
  "LeadMerged",
  "TaskCreated",
  "MeetingConfirmed",
  "MeetingChanged",
  "SheetInboundApplied",
  "SheetConflictDetected",
  "GoogleReauthRequired",
  "AutomationRunStarted",
  "AutomationRunCompleted",
  "AutomationRunFailed",
  "MessageQueued",
] as const;
export type DomainEventType = (typeof domainEventTypes)[number];

export const actorTypeSchema = z.enum([
  "USER",
  "AI",
  "SYSTEM",
  "GOOGLE_SHEET",
  "GOOGLE_CALENDAR",
]);

export const domainEventEnvelopeSchema = z.object({
  eventId: z.string().uuid(),
  type: z.enum(domainEventTypes),
  version: z.number().int().positive(),
  occurredAt: z.string().datetime(),
  organizationId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  aggregateType: z.string().min(1).max(80),
  aggregateId: z.string().uuid(),
  aggregateVersion: z.number().int().positive(),
  actorType: actorTypeSchema,
  actorId: z.string().uuid().optional(),
  correlationId: z.string().min(1).max(128),
  causationId: z.string().max(128).optional(),
  // Events intentionally carry identifiers and non-sensitive routing metadata only.
  payload: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
});
export type DomainEventEnvelope = z.infer<typeof domainEventEnvelopeSchema>;

export const leadSourceSchema = z.enum([
  "INSTAGRAM",
  "MANUAL",
  "API",
  "GOOGLE_SHEET",
  "AUTOMATION",
]);

export const contactIdentityInputSchema = z.object({
  type: z.enum(["INSTAGRAM", "EMAIL", "PHONE", "EXTERNAL"]),
  scopeKey: z.string().max(255).default(""),
  value: z.string().trim().min(1).max(500),
  displayValue: z.string().trim().max(500).optional(),
}).strict();

export const leadCaptureInputSchema = z.object({
  pipelineId: z.string().uuid().optional(),
  identity: contactIdentityInputSchema,
  name: z.string().trim().max(200).optional(),
  username: z.string().trim().max(200).optional(),
  source: leadSourceSchema,
  sourceDetail: z.record(z.unknown()).optional(),
  attributes: z.record(z.unknown()).default({}),
  consent: z
    .object({ purpose: z.string().min(1).max(120), status: z.enum(["GRANTED", "REVOKED"]), source: z.string().max(120) }).strict()
    .optional(),
}).strict();
export type LeadCaptureInput = z.infer<typeof leadCaptureInputSchema>;

export const leadResponseSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  contactId: z.string().uuid(),
  pipelineId: z.string().uuid(),
  stageId: z.string().uuid(),
  ownerMembershipId: z.string().uuid().nullable(),
  recordState: z.enum(["ACTIVE", "ARCHIVED", "MERGED"]),
  outcome: z.enum(["OPEN", "WON", "LOST"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  source: leadSourceSchema,
  score: z.number().int().min(0).max(100),
  version: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type LeadResponse = z.infer<typeof leadResponseSchema>;

export const sheetColumnMappingSchema = z.object({
  columnIndex: z.number().int().nonnegative(),
  columnName: z.string().min(1).max(200),
  fieldKey: z.string().min(1).max(100),
  direction: z.enum(["APP_OWNED", "SHEET_OWNED", "TWO_WAY"]),
  transform: z.enum(["NONE", "LOWERCASE", "UPPERCASE", "E164_PHONE", "ISO_DATE"]).default("NONE"),
  sensitiveExportApproved: z.boolean().default(false),
}).strict();
export type SheetColumnMapping = z.infer<typeof sheetColumnMappingSchema>;

export const meetingTypeSchema = z.object({
  id: z.string().uuid().optional(),
  calendarPoolId: z.string().uuid(),
  name: z.string().min(1).max(120),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  durationMinutes: z.number().int().min(15).max(480).default(30),
  intervalMinutes: z.number().int().min(5).max(120).default(15),
  bufferBeforeMinutes: z.number().int().min(0).max(240).default(15),
  bufferAfterMinutes: z.number().int().min(0).max(240).default(15),
  minimumNoticeMinutes: z.number().int().min(0).default(240),
  bookingHorizonDays: z.number().int().min(1).max(365).default(30),
  timezone: z.string().min(1),
  availabilityRules: z.record(z.unknown()),
}).strict();
export type MeetingType = z.infer<typeof meetingTypeSchema>;

export const sendMeetingInvitationSchema = z.object({
  conversationId: z.string().uuid(),
  leadId: z.string().uuid(),
  meetingTypeId: z.string().uuid(),
  expiresInDays: z.number().int().min(1).max(30).default(7),
  introduction: z.string().trim().min(1).max(600).optional(),
}).strict();
export type SendMeetingInvitation = z.infer<typeof sendMeetingInvitationSchema>;

export const googleBindingSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  ownership: z.enum(["MEMBER", "WORKSPACE"]),
  capabilities: z.array(z.enum(["CALENDAR", "SHEETS"])),
  status: z.enum(["PENDING_AUTH", "ACTIVE", "REAUTH_REQUIRED", "TRANSFER_REQUIRED", "ERROR", "DISCONNECTED"]),
  version: z.number().int().positive(),
}).strict();
export type GoogleBinding = z.infer<typeof googleBindingSchema>;

export const googleIntegrationAvailabilitySchema = z.object({
  available: z.boolean(),
  status: z.enum(["AVAILABLE", "FEATURE_DISABLED", "ADMIN_SETUP_REQUIRED"]),
}).strict();

export const googleIntegrationReadinessSchema = z.object({
  oauth: googleIntegrationAvailabilitySchema,
  calendar: googleIntegrationAvailabilitySchema,
  sheets: googleIntegrationAvailabilitySchema,
}).strict();
export type GoogleIntegrationReadiness = z.infer<typeof googleIntegrationReadinessSchema>;

export const decisionCommandSchema = z.object({
  kind: z.enum(["SET_FIELD", "SET_SCORE", "MOVE_STAGE", "ASSIGN_OWNER", "ASK_CLARIFICATION", "NOOP"]),
  fieldId: z.string().uuid().optional(),
  value: z.unknown().optional(),
  score: z.number().int().min(0).max(100).optional(),
  stageId: z.string().uuid().optional(),
  membershipId: z.string().uuid().optional(),
  confidence: z.number().min(0).max(1),
  evidenceMessageIds: z.array(z.string().uuid()).max(50),
  rationale: z.string().min(1).max(1000),
  strategyVersion: z.string().min(1).max(80),
  modelVersion: z.string().max(120).optional(),
  promptVersion: z.string().max(120).optional(),
}).strict();
export type DecisionCommand = z.infer<typeof decisionCommandSchema>;

export interface GoogleCalendarJob {
  eventId: string;
  workspaceId: string;
  meetingId: string;
  operation: "CREATE" | "UPDATE" | "CANCEL" | "RECONCILE" | "SYNC_CALENDAR";
}

export interface GoogleSheetsJob {
  eventId: string;
  workspaceId: string;
  destinationId: string;
  operation: "PROJECT_LEAD" | "DRAIN_CHANGES" | "RECONCILE" | "REPAIR";
  leadId?: string;
}
