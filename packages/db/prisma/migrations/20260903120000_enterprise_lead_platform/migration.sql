-- CreateEnum
CREATE TYPE "AUTOMATION_ENGINE" AS ENUM ('LEGACY', 'FLOW');

-- AlterEnum
ALTER TYPE "FLOW_STATUS" ADD VALUE IF NOT EXISTS 'ARCHIVED';

-- CreateEnum
CREATE TYPE "MEMBERSHIP_STATUS" AS ENUM ('ACTIVE', 'REMOVED');

-- CreateEnum
CREATE TYPE "LEAD_RECORD_STATE" AS ENUM ('ACTIVE', 'ARCHIVED', 'MERGED');

-- CreateEnum
CREATE TYPE "LEAD_OUTCOME" AS ENUM ('OPEN', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "LEAD_PRIORITY" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "LEAD_SOURCE" AS ENUM ('INSTAGRAM', 'MANUAL', 'API', 'GOOGLE_SHEET', 'AUTOMATION');

-- CreateEnum
CREATE TYPE "LEAD_PIPELINE_STATUS" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LEAD_FUNNEL_CATEGORY" AS ENUM ('NEW', 'ENGAGING', 'QUALIFIED', 'MEETING_BOOKED', 'PROPOSAL', 'WON', 'LOST', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CONTACT_IDENTITY_TYPE" AS ENUM ('INSTAGRAM', 'EMAIL', 'PHONE', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "DATA_CLASSIFICATION" AS ENUM ('INTERNAL', 'CONFIDENTIAL', 'SENSITIVE');

-- CreateEnum
CREATE TYPE "SHEET_EXPORT_POLICY" AS ENUM ('DENY', 'ADMIN_OPT_IN', 'ALLOW');

-- CreateEnum
CREATE TYPE "LEAD_VALUE_SOURCE" AS ENUM ('HUMAN', 'API', 'SHEET', 'AI', 'SYSTEM');

-- CreateEnum
CREATE TYPE "LEAD_TASK_STATUS" AS ENUM ('OPEN', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "CONSENT_STATUS" AS ENUM ('GRANTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ACTOR_TYPE" AS ENUM ('USER', 'AI', 'SYSTEM', 'GOOGLE_SHEET', 'GOOGLE_CALENDAR');

-- CreateEnum
CREATE TYPE "DECISION_TYPE" AS ENUM ('QUALIFICATION', 'SCORING', 'ASSIGNMENT', 'STAGE_TRANSITION');

-- CreateEnum
CREATE TYPE "GOOGLE_GRANT_STATUS" AS ENUM ('ACTIVE', 'REAUTH_REQUIRED', 'REVOKED', 'ERROR');

-- CreateEnum
CREATE TYPE "GOOGLE_BINDING_STATUS" AS ENUM ('PENDING_AUTH', 'ACTIVE', 'REAUTH_REQUIRED', 'TRANSFER_REQUIRED', 'ERROR', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "GOOGLE_BINDING_OWNERSHIP" AS ENUM ('MEMBER', 'WORKSPACE');

-- CreateEnum
CREATE TYPE "GOOGLE_CAPABILITY" AS ENUM ('CALENDAR', 'SHEETS');

-- CreateEnum
CREATE TYPE "GOOGLE_WATCH_TYPE" AS ENUM ('CALENDAR_EVENTS', 'DRIVE_CHANGES');

-- CreateEnum
CREATE TYPE "GOOGLE_WATCH_STATUS" AS ENUM ('ACTIVE', 'RENEWING', 'EXPIRED', 'STOPPED', 'ERROR');

-- CreateEnum
CREATE TYPE "CALENDAR_POOL_STATUS" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MEETING_STATUS" AS ENUM ('PENDING', 'CONFIRMED', 'CONFLICTED', 'FAILED', 'CANCELED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "BOOKING_LINK_STATUS" AS ENUM ('ACTIVE', 'BOOKED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "SLOT_RESERVATION_STATUS" AS ENUM ('HELD', 'CONFIRMED', 'RELEASED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SHEET_DESTINATION_STATUS" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'MISCONFIGURED', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "SHEET_INITIAL_AUTHORITY" AS ENUM ('IMPORT', 'EXPORT', 'REVIEWED_MERGE');

-- CreateEnum
CREATE TYPE "SHEET_MAPPING_DIRECTION" AS ENUM ('APP_OWNED', 'SHEET_OWNED', 'TWO_WAY');

-- CreateEnum
CREATE TYPE "SHEET_ROW_STATUS" AS ENUM ('SYNCED', 'PENDING', 'CONFLICT', 'ROW_MISSING', 'ERROR', 'EXCLUDED');

-- CreateEnum
CREATE TYPE "SHEET_CONFLICT_STATUS" AS ENUM ('OPEN', 'RESOLVED_APP', 'RESOLVED_SHEET', 'RESOLVED_MERGE', 'DISMISSED');

-- CreateEnum
CREATE TYPE "INTEGRATION_OPERATION_STATUS" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'REAUTH_REQUIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "OUTBOX_STATUS" AS ENUM ('PENDING', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "IDEMPOTENCY_STATUS" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "API_KEY_STATUS" AS ENUM ('ACTIVE', 'REVOKED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LEAD_FIELD_TYPE" ADD VALUE 'DATE';
ALTER TYPE "LEAD_FIELD_TYPE" ADD VALUE 'DATETIME';
ALTER TYPE "LEAD_FIELD_TYPE" ADD VALUE 'EMAIL';
ALTER TYPE "LEAD_FIELD_TYPE" ADD VALUE 'PHONE';
ALTER TYPE "LEAD_FIELD_TYPE" ADD VALUE 'URL';
ALTER TYPE "LEAD_FIELD_TYPE" ADD VALUE 'SELECT';
ALTER TYPE "LEAD_FIELD_TYPE" ADD VALUE 'MULTI_SELECT';
ALTER TYPE "LEAD_FIELD_TYPE" ADD VALUE 'CURRENCY';

-- AlterEnum
ALTER TYPE "RUN_STATUS" ADD VALUE 'WAITING_INPUT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WEBHOOK_PROVIDER" ADD VALUE 'GOOGLE_DRIVE';
ALTER TYPE "WEBHOOK_PROVIDER" ADD VALUE 'GOOGLE_CALENDAR';

-- DropForeignKey
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_contactId_fkey";

-- DropIndex
DROP INDEX "Lead_contactId_key";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "correlationId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'APPLICATION';

-- AlterTable
ALTER TABLE "Contact" ALTER COLUMN "igAccountId" DROP NOT NULL,
ALTER COLUMN "igUserId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "canonicalLeadId" UUID,
ADD COLUMN     "currency" CHAR(3),
ADD COLUMN     "expectedCloseAt" TIMESTAMP(3),
ADD COLUMN     "expectedValueMinor" BIGINT,
ADD COLUMN     "lostAt" TIMESTAMP(3),
ADD COLUMN     "nextActionAt" TIMESTAMP(3),
ADD COLUMN     "outcome" "LEAD_OUTCOME" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "ownerMembershipId" UUID,
ADD COLUMN     "pipelineId" UUID,
ADD COLUMN     "priority" "LEAD_PRIORITY" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "recordState" "LEAD_RECORD_STATE" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "source" "LEAD_SOURCE" NOT NULL DEFAULT 'INSTAGRAM',
ADD COLUMN     "sourceDetail" JSONB,
ADD COLUMN     "stageId" UUID,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "wonAt" TIMESTAMP(3),
ADD COLUMN     "workspaceId" UUID;

-- AlterTable
ALTER TABLE "LeadField" ADD COLUMN     "aiWritable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "classification" "DATA_CLASSIFICATION" NOT NULL DEFAULT 'INTERNAL',
ADD COLUMN     "options" JSONB,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "required" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sheetExportPolicy" "SHEET_EXPORT_POLICY" NOT NULL DEFAULT 'DENY',
ADD COLUMN     "validation" JSONB;

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "automationEngine" "AUTOMATION_ENGINE" NOT NULL DEFAULT 'LEGACY',
ADD COLUMN     "baseCurrency" CHAR(3) NOT NULL DEFAULT 'USD',
ADD COLUMN     "automationPausedAt" TIMESTAMP(3),
ADD COLUMN     "aiPolicyVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "aiPolicy" JSONB NOT NULL DEFAULT '{"factConfidence":0.85,"decisionConfidence":0.9,"terminalConfidence":0.95}',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC';

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "status" "MEMBERSHIP_STATUS" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "removedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Flow" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- Existing tenants stay on exactly one known engine. Workspaces with an active
-- published Flow are cut over to FLOW; all others remain on the legacy adapter.
UPDATE "Workspace" AS workspace
SET "automationEngine" = 'FLOW'
WHERE EXISTS (
  SELECT 1 FROM "Flow"
  WHERE "Flow"."workspaceId" = workspace."id"
    AND "Flow"."status" = 'ACTIVE'
    AND "Flow"."activeVersionId" IS NOT NULL
);
ALTER TABLE "Workspace" ALTER COLUMN "automationEngine" SET DEFAULT 'FLOW';

-- CreateTable
CREATE TABLE "ContactIdentity" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "type" "CONTACT_IDENTITY_TYPE" NOT NULL,
    "scopeKey" TEXT NOT NULL DEFAULT '',
    "normalizedValue" TEXT NOT NULL,
    "displayValue" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPipeline" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "LEAD_PIPELINE_STATUS" NOT NULL DEFAULT 'DRAFT',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadPipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadStage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "pipelineId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "funnelCategory" "LEAD_FUNNEL_CATEGORY" NOT NULL,
    "position" INTEGER NOT NULL,
    "probability" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL DEFAULT 'slate',
    "slaMinutes" INTEGER,
    "requiredFieldKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lostReasonRequired" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadStage_pkey" PRIMARY KEY ("id")
);

-- Backfill the Lead V2 ownership graph before enforcing required columns.
INSERT INTO "LeadPipeline" ("id", "workspaceId", "name", "description", "status", "isDefault")
SELECT gen_random_uuid(), "id", 'Sales', 'Default sales pipeline', 'ACTIVE', true
FROM "Workspace";

INSERT INTO "LeadStage" ("id", "workspaceId", "pipelineId", "name", "funnelCategory", "position", "probability", "color", "lostReasonRequired")
SELECT gen_random_uuid(), pipeline."workspaceId", pipeline."id", seed.name,
       seed.category::"LEAD_FUNNEL_CATEGORY", seed.position, seed.probability, seed.color, seed.lost_reason
FROM "LeadPipeline" AS pipeline
CROSS JOIN (VALUES
  ('New', 'NEW', 0, 5, 'slate', false),
  ('Engaging', 'ENGAGING', 1, 20, 'blue', false),
  ('Qualified', 'QUALIFIED', 2, 50, 'violet', false),
  ('Meeting Booked', 'MEETING_BOOKED', 3, 65, 'cyan', false),
  ('Proposal', 'PROPOSAL', 4, 80, 'amber', false),
  ('Won', 'WON', 5, 100, 'green', false),
  ('Lost', 'LOST', 6, 0, 'red', true)
) AS seed(name, category, position, probability, color, lost_reason)
WHERE pipeline."isDefault" = true;

UPDATE "Lead" AS lead
SET "workspaceId" = contact."workspaceId",
    "pipelineId" = pipeline."id",
    "stageId" = stage."id",
    "outcome" = CASE WHEN lead."status" = 'DISQUALIFIED' THEN 'LOST'::"LEAD_OUTCOME" ELSE 'OPEN'::"LEAD_OUTCOME" END,
    "lostAt" = CASE WHEN lead."status" = 'DISQUALIFIED' THEN COALESCE(lead."disqualifiedAt", lead."updatedAt") ELSE NULL END
FROM "Contact" AS contact
JOIN "LeadPipeline" AS pipeline ON pipeline."workspaceId" = contact."workspaceId" AND pipeline."isDefault" = true
JOIN "LeadStage" AS stage ON stage."pipelineId" = pipeline."id"
WHERE lead."contactId" = contact."id"
  AND stage."funnelCategory" = CASE lead."status"
    WHEN 'NEW' THEN 'NEW'::"LEAD_FUNNEL_CATEGORY"
    WHEN 'CONTACTED' THEN 'ENGAGING'::"LEAD_FUNNEL_CATEGORY"
    WHEN 'QUALIFIED' THEN 'QUALIFIED'::"LEAD_FUNNEL_CATEGORY"
    WHEN 'DISQUALIFIED' THEN 'LOST'::"LEAD_FUNNEL_CATEGORY"
  END;

INSERT INTO "ContactIdentity" ("workspaceId", "contactId", "type", "scopeKey", "normalizedValue", "displayValue", "isPrimary")
SELECT "workspaceId", "id", 'INSTAGRAM', "igAccountId"::text, "igUserId", "igUserId", true
FROM "Contact"
WHERE "igAccountId" IS NOT NULL AND "igUserId" IS NOT NULL
ON CONFLICT DO NOTHING;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Lead" WHERE "workspaceId" IS NULL OR "pipelineId" IS NULL OR "stageId" IS NULL) THEN
    RAISE EXCEPTION 'Lead V2 backfill incomplete; refusing to enforce required tenant columns';
  END IF;
END $$;

ALTER TABLE "Lead"
  ALTER COLUMN "workspaceId" SET NOT NULL,
  ALTER COLUMN "pipelineId" SET NOT NULL,
  ALTER COLUMN "stageId" SET NOT NULL;

-- CreateTable
CREATE TABLE "LeadAttributeValue" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "fieldId" UUID NOT NULL,
    "value" JSONB NOT NULL,
    "source" "LEAD_VALUE_SOURCE" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "evidenceMessageId" UUID,
    "updatedByMembershipId" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadAttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "actorType" "ACTOR_TYPE" NOT NULL,
    "actorId" UUID,
    "correlationId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadTask" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3),
    "assigneeMembershipId" UUID,
    "status" "LEAD_TASK_STATUS" NOT NULL DEFAULT 'OPEN',
    "version" INTEGER NOT NULL DEFAULT 1,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadSavedView" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "filters" JSONB NOT NULL,
    "sort" JSONB,
    "columns" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadSavedView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" "CONSENT_STATUS" NOT NULL,
    "source" TEXT NOT NULL,
    "evidence" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "type" "DECISION_TYPE" NOT NULL,
    "strategy" TEXT NOT NULL,
    "model" TEXT,
    "promptVersion" TEXT,
    "policyVersion" INTEGER,
    "confidence" DOUBLE PRECISION,
    "evidenceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "proposed" JSONB NOT NULL,
    "applied" JSONB,
    "outcome" JSONB,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleGrant" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "googleSub" TEXT NOT NULL,
    "email" TEXT,
    "oauthClientId" TEXT NOT NULL,
    "encryptedRefreshToken" TEXT,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "GOOGLE_GRANT_STATUS" NOT NULL DEFAULT 'ACTIVE',
    "tokenVersion" INTEGER NOT NULL DEFAULT 1,
    "lastRefreshAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoogleGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleBinding" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "grantId" UUID NOT NULL,
    "authorizedMembershipId" UUID NOT NULL,
    "ownership" "GOOGLE_BINDING_OWNERSHIP" NOT NULL,
    "capabilities" "GOOGLE_CAPABILITY"[] DEFAULT ARRAY[]::"GOOGLE_CAPABILITY"[],
    "status" "GOOGLE_BINDING_STATUS" NOT NULL DEFAULT 'PENDING_AUTH',
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastHealthAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoogleBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleWatchChannel" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bindingId" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "type" "GOOGLE_WATCH_TYPE" NOT NULL,
    "channelId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "resourceUri" TEXT,
    "secretHash" TEXT NOT NULL,
    "calendarId" TEXT,
    "syncToken" TEXT,
    "pageToken" TEXT,
    "messageNumber" BIGINT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "GOOGLE_WATCH_STATUS" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoogleWatchChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarPool" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CALENDAR_POOL_STATUS" NOT NULL DEFAULT 'DRAFT',
    "routingCursor" BIGINT NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarPoolMember" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "poolId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "googleBindingId" UUID NOT NULL,
    "calendarId" TEXT NOT NULL,
    "conflictCalendarIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastAssignedSequence" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarPoolMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingType" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "calendarPoolId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "intervalMinutes" INTEGER NOT NULL DEFAULT 15,
    "bufferBeforeMinutes" INTEGER NOT NULL DEFAULT 15,
    "bufferAfterMinutes" INTEGER NOT NULL DEFAULT 15,
    "minimumNoticeMinutes" INTEGER NOT NULL DEFAULT 240,
    "bookingHorizonDays" INTEGER NOT NULL DEFAULT 30,
    "timezone" TEXT NOT NULL,
    "availabilityRules" JSONB NOT NULL,
    "locationType" TEXT NOT NULL DEFAULT 'GOOGLE_MEET',
    "stageOnBookId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadMeeting" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "meetingTypeId" UUID NOT NULL,
    "hostMembershipId" UUID NOT NULL,
    "status" "MEETING_STATUS" NOT NULL DEFAULT 'PENDING',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "inviteeEmail" TEXT NOT NULL,
    "providerCalendarId" TEXT,
    "providerEventId" TEXT,
    "providerEtag" TEXT,
    "conferenceUrl" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "failureCode" TEXT,
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingLink" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publicId" TEXT NOT NULL,
    "workspaceId" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "meetingTypeId" UUID NOT NULL,
    "meetingId" UUID,
    "secretHash" TEXT NOT NULL,
    "status" "BOOKING_LINK_STATUS" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlotReservation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "googleBindingId" UUID NOT NULL,
    "meetingId" UUID,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "SLOT_RESERVATION_STATUS" NOT NULL DEFAULT 'HELD',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlotReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheetDestination" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "googleBindingId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "spreadsheetId" TEXT NOT NULL,
    "sheetId" INTEGER NOT NULL,
    "sheetTitle" TEXT NOT NULL,
    "pipelineId" UUID,
    "status" "SHEET_DESTINATION_STATUS" NOT NULL DEFAULT 'DRAFT',
    "initialAuthority" "SHEET_INITIAL_AUTHORITY" NOT NULL,
    "mappingVersion" INTEGER NOT NULL DEFAULT 1,
    "maxManagedRows" INTEGER NOT NULL DEFAULT 50000,
    "lastSyncedAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SheetDestination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheetColumnMapping" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "destinationId" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "columnIndex" INTEGER NOT NULL,
    "columnName" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "direction" "SHEET_MAPPING_DIRECTION" NOT NULL,
    "transform" TEXT,
    "sensitiveExportApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SheetColumnMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheetRowProjection" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "destinationId" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "rowNumber" INTEGER,
    "metadataKey" TEXT NOT NULL,
    "leadVersion" INTEGER NOT NULL,
    "mappingVersion" INTEGER NOT NULL,
    "syncHash" TEXT NOT NULL,
    "status" "SHEET_ROW_STATUS" NOT NULL DEFAULT 'PENDING',
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SheetRowProjection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheetSyncConflict" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "destinationId" UUID NOT NULL,
    "leadId" UUID,
    "fieldKey" TEXT,
    "appValue" JSONB,
    "sheetValue" JSONB,
    "appVersion" INTEGER,
    "sheetVersion" INTEGER,
    "status" "SHEET_CONFLICT_STATUS" NOT NULL DEFAULT 'OPEN',
    "resolution" JSONB,
    "resolvedById" UUID,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SheetSyncConflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationOperation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "googleBindingId" UUID,
    "type" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "operationKey" TEXT NOT NULL,
    "status" "INTEGRATION_OPERATION_STATUS" NOT NULL DEFAULT 'PENDING',
    "expectedVersion" INTEGER,
    "request" JSONB,
    "response" JSONB,
    "lastErrorCode" TEXT,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationAttempt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operationId" UUID NOT NULL,
    "attempt" INTEGER NOT NULL,
    "statusCode" INTEGER,
    "providerCode" TEXT,
    "retryable" BOOLEAN NOT NULL DEFAULT false,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" UUID NOT NULL,
    "aggregateVersion" INTEGER NOT NULL,
    "actorType" "ACTOR_TYPE" NOT NULL,
    "actorId" UUID,
    "correlationId" TEXT NOT NULL,
    "causationId" TEXT,
    "payload" JSONB NOT NULL,
    "status" "OUTBOX_STATUS" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "consumer" TEXT NOT NULL,
    "eventId" UUID NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "route" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "status" "IDEMPOTENCY_STATUS" NOT NULL DEFAULT 'IN_PROGRESS',
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactIdentity_contactId_idx" ON "ContactIdentity"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactIdentity_workspaceId_type_scopeKey_normalizedValue_key" ON "ContactIdentity"("workspaceId", "type", "scopeKey", "normalizedValue");

-- CreateIndex
CREATE INDEX "LeadPipeline_workspaceId_status_idx" ON "LeadPipeline"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LeadPipeline_id_workspaceId_key" ON "LeadPipeline"("id", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadPipeline_workspaceId_name_key" ON "LeadPipeline"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "LeadStage_workspaceId_funnelCategory_idx" ON "LeadStage"("workspaceId", "funnelCategory");

-- CreateIndex
CREATE UNIQUE INDEX "LeadStage_id_pipelineId_workspaceId_key" ON "LeadStage"("id", "pipelineId", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadStage_id_workspaceId_key" ON "LeadStage"("id", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadStage_pipelineId_position_key" ON "LeadStage"("pipelineId", "position");

-- CreateIndex
CREATE INDEX "LeadAttributeValue_workspaceId_fieldId_idx" ON "LeadAttributeValue"("workspaceId", "fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadAttributeValue_leadId_fieldId_key" ON "LeadAttributeValue"("leadId", "fieldId");

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_createdAt_idx" ON "LeadActivity"("leadId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "LeadActivity_workspaceId_createdAt_idx" ON "LeadActivity"("workspaceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "LeadTask_workspaceId_status_dueAt_idx" ON "LeadTask"("workspaceId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "LeadTask_leadId_status_idx" ON "LeadTask"("leadId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LeadTask_id_workspaceId_key" ON "LeadTask"("id", "workspaceId");

-- CreateIndex
CREATE INDEX "LeadSavedView_workspaceId_isShared_idx" ON "LeadSavedView"("workspaceId", "isShared");

-- CreateIndex
CREATE UNIQUE INDEX "LeadSavedView_workspaceId_ownerUserId_name_key" ON "LeadSavedView"("workspaceId", "ownerUserId", "name");

-- CreateIndex
CREATE INDEX "ConsentRecord_workspaceId_contactId_purpose_idx" ON "ConsentRecord"("workspaceId", "contactId", "purpose");

-- CreateIndex
CREATE INDEX "DecisionLog_workspaceId_type_createdAt_idx" ON "DecisionLog"("workspaceId", "type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "DecisionLog_leadId_createdAt_idx" ON "DecisionLog"("leadId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "GoogleGrant_status_updatedAt_idx" ON "GoogleGrant"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleGrant_userId_googleSub_oauthClientId_key" ON "GoogleGrant"("userId", "googleSub", "oauthClientId");

-- CreateIndex
CREATE INDEX "GoogleBinding_workspaceId_status_idx" ON "GoogleBinding"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleBinding_id_workspaceId_key" ON "GoogleBinding"("id", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleBinding_workspaceId_grantId_ownership_authorizedMembe_key" ON "GoogleBinding"("workspaceId", "grantId", "ownership", "authorizedMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleWatchChannel_channelId_key" ON "GoogleWatchChannel"("channelId");

-- CreateIndex
CREATE INDEX "GoogleWatchChannel_bindingId_type_status_idx" ON "GoogleWatchChannel"("bindingId", "type", "status");

-- CreateIndex
CREATE INDEX "GoogleWatchChannel_expiresAt_status_idx" ON "GoogleWatchChannel"("expiresAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarPool_id_workspaceId_key" ON "CalendarPool"("id", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarPool_workspaceId_name_key" ON "CalendarPool"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "CalendarPoolMember_workspaceId_enabled_lastAssignedSequence_idx" ON "CalendarPoolMember"("workspaceId", "enabled", "lastAssignedSequence");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarPoolMember_poolId_membershipId_key" ON "CalendarPoolMember"("poolId", "membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingType_id_workspaceId_key" ON "MeetingType"("id", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingType_workspaceId_slug_key" ON "MeetingType"("workspaceId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "LeadMeeting_providerEventId_key" ON "LeadMeeting"("providerEventId");

-- CreateIndex
CREATE INDEX "LeadMeeting_workspaceId_startsAt_status_idx" ON "LeadMeeting"("workspaceId", "startsAt", "status");

-- CreateIndex
CREATE INDEX "LeadMeeting_leadId_status_idx" ON "LeadMeeting"("leadId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LeadMeeting_id_workspaceId_key" ON "LeadMeeting"("id", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingLink_publicId_key" ON "BookingLink"("publicId");

-- CreateIndex
CREATE INDEX "BookingLink_workspaceId_leadId_status_idx" ON "BookingLink"("workspaceId", "leadId", "status");

-- CreateIndex
CREATE INDEX "BookingLink_expiresAt_status_idx" ON "BookingLink"("expiresAt", "status");

-- CreateIndex
CREATE INDEX "SlotReservation_workspaceId_googleBindingId_startsAt_endsAt_idx" ON "SlotReservation"("workspaceId", "googleBindingId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "SlotReservation_expiresAt_status_idx" ON "SlotReservation"("expiresAt", "status");

-- CreateIndex
CREATE INDEX "SheetDestination_workspaceId_status_idx" ON "SheetDestination"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SheetDestination_id_workspaceId_key" ON "SheetDestination"("id", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "SheetDestination_workspaceId_spreadsheetId_sheetId_key" ON "SheetDestination"("workspaceId", "spreadsheetId", "sheetId");

-- CreateIndex
CREATE UNIQUE INDEX "SheetColumnMapping_destinationId_columnIndex_key" ON "SheetColumnMapping"("destinationId", "columnIndex");

-- CreateIndex
CREATE UNIQUE INDEX "SheetColumnMapping_destinationId_fieldKey_key" ON "SheetColumnMapping"("destinationId", "fieldKey");

-- CreateIndex
CREATE INDEX "SheetRowProjection_workspaceId_status_idx" ON "SheetRowProjection"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SheetRowProjection_destinationId_leadId_key" ON "SheetRowProjection"("destinationId", "leadId");

-- CreateIndex
CREATE UNIQUE INDEX "SheetRowProjection_destinationId_metadataKey_key" ON "SheetRowProjection"("destinationId", "metadataKey");

-- CreateIndex
CREATE INDEX "SheetSyncConflict_workspaceId_status_createdAt_idx" ON "SheetSyncConflict"("workspaceId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SheetSyncConflict_destinationId_status_idx" ON "SheetSyncConflict"("destinationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationOperation_operationKey_key" ON "IntegrationOperation"("operationKey");

-- CreateIndex
CREATE INDEX "IntegrationOperation_workspaceId_status_createdAt_idx" ON "IntegrationOperation"("workspaceId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationAttempt_operationId_attempt_key" ON "IntegrationAttempt"("operationId", "attempt");

-- CreateIndex
CREATE UNIQUE INDEX "OutboxEvent_eventId_key" ON "OutboxEvent"("eventId");

-- CreateIndex
CREATE INDEX "OutboxEvent_status_availableAt_occurredAt_idx" ON "OutboxEvent"("status", "availableAt", "occurredAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_workspaceId_occurredAt_idx" ON "OutboxEvent"("workspaceId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "ProcessedEvent_processedAt_idx" ON "ProcessedEvent"("processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedEvent_consumer_eventId_key" ON "ProcessedEvent"("consumer", "eventId");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRecord_workspaceId_actorId_route_key_key" ON "IdempotencyRecord"("workspaceId", "actorId", "route", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_id_workspaceId_key" ON "Contact"("id", "workspaceId");

-- CreateIndex
CREATE INDEX "Lead_workspaceId_pipelineId_stageId_updatedAt_idx" ON "Lead"("workspaceId", "pipelineId", "stageId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Lead_workspaceId_ownerMembershipId_nextActionAt_idx" ON "Lead"("workspaceId", "ownerMembershipId", "nextActionAt");

-- CreateIndex
CREATE INDEX "Lead_workspaceId_recordState_outcome_score_idx" ON "Lead"("workspaceId", "recordState", "outcome", "score");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_id_workspaceId_key" ON "Lead"("id", "workspaceId");

-- CreateIndex
CREATE INDEX "LeadField_workspaceId_archivedAt_position_idx" ON "LeadField"("workspaceId", "archivedAt", "position");

-- CreateIndex
CREATE UNIQUE INDEX "LeadField_id_workspaceId_key" ON "LeadField"("id", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_id_workspaceId_key" ON "Membership"("id", "workspaceId");

-- Database-enforced invariants that Prisma cannot express directly.
CREATE UNIQUE INDEX "LeadPipeline_one_default_per_workspace_key"
ON "LeadPipeline" ("workspaceId") WHERE "isDefault" = true;

CREATE UNIQUE INDEX "Lead_one_open_per_contact_pipeline_key"
ON "Lead" ("workspaceId", "contactId", "pipelineId")
WHERE "recordState" = 'ACTIVE' AND "outcome" = 'OPEN';

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_score_range_check" CHECK ("score" BETWEEN 0 AND 100);
ALTER TABLE "LeadStage" ADD CONSTRAINT "LeadStage_probability_range_check" CHECK ("probability" BETWEEN 0 AND 100);
ALTER TABLE "LeadMeeting" ADD CONSTRAINT "LeadMeeting_time_order_check" CHECK ("startsAt" < "endsAt");
ALTER TABLE "SlotReservation" ADD CONSTRAINT "SlotReservation_time_order_check" CHECK ("startsAt" < "endsAt");
ALTER TABLE "SheetDestination" ADD CONSTRAINT "SheetDestination_managed_rows_check" CHECK ("maxManagedRows" BETWEEN 1 AND 50000);

CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "SlotReservation" ADD CONSTRAINT "SlotReservation_no_overlap_excl"
EXCLUDE USING gist (
  "googleBindingId" WITH =,
  tsrange("startsAt", "endsAt", '[)') WITH &&
) WHERE ("status" IN ('HELD', 'CONFIRMED'));

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_contactId_workspaceId_fkey" FOREIGN KEY ("contactId", "workspaceId") REFERENCES "Contact"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_pipelineId_workspaceId_fkey" FOREIGN KEY ("pipelineId", "workspaceId") REFERENCES "LeadPipeline"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_stageId_pipelineId_workspaceId_fkey" FOREIGN KEY ("stageId", "pipelineId", "workspaceId") REFERENCES "LeadStage"("id", "pipelineId", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_ownerMembershipId_workspaceId_fkey" FOREIGN KEY ("ownerMembershipId", "workspaceId") REFERENCES "Membership"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_canonicalLeadId_fkey" FOREIGN KEY ("canonicalLeadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactIdentity" ADD CONSTRAINT "ContactIdentity_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactIdentity" ADD CONSTRAINT "ContactIdentity_contactId_workspaceId_fkey" FOREIGN KEY ("contactId", "workspaceId") REFERENCES "Contact"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPipeline" ADD CONSTRAINT "LeadPipeline_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadStage" ADD CONSTRAINT "LeadStage_pipelineId_workspaceId_fkey" FOREIGN KEY ("pipelineId", "workspaceId") REFERENCES "LeadPipeline"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAttributeValue" ADD CONSTRAINT "LeadAttributeValue_leadId_workspaceId_fkey" FOREIGN KEY ("leadId", "workspaceId") REFERENCES "Lead"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAttributeValue" ADD CONSTRAINT "LeadAttributeValue_fieldId_workspaceId_fkey" FOREIGN KEY ("fieldId", "workspaceId") REFERENCES "LeadField"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAttributeValue" ADD CONSTRAINT "LeadAttributeValue_updatedByMembershipId_workspaceId_fkey" FOREIGN KEY ("updatedByMembershipId", "workspaceId") REFERENCES "Membership"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_workspaceId_fkey" FOREIGN KEY ("leadId", "workspaceId") REFERENCES "Lead"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadTask" ADD CONSTRAINT "LeadTask_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadTask" ADD CONSTRAINT "LeadTask_leadId_workspaceId_fkey" FOREIGN KEY ("leadId", "workspaceId") REFERENCES "Lead"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadTask" ADD CONSTRAINT "LeadTask_assigneeMembershipId_workspaceId_fkey" FOREIGN KEY ("assigneeMembershipId", "workspaceId") REFERENCES "Membership"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadSavedView" ADD CONSTRAINT "LeadSavedView_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_contactId_workspaceId_fkey" FOREIGN KEY ("contactId", "workspaceId") REFERENCES "Contact"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionLog" ADD CONSTRAINT "DecisionLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionLog" ADD CONSTRAINT "DecisionLog_leadId_workspaceId_fkey" FOREIGN KEY ("leadId", "workspaceId") REFERENCES "Lead"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleGrant" ADD CONSTRAINT "GoogleGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleBinding" ADD CONSTRAINT "GoogleBinding_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleBinding" ADD CONSTRAINT "GoogleBinding_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "GoogleGrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleBinding" ADD CONSTRAINT "GoogleBinding_authorizedMembershipId_workspaceId_fkey" FOREIGN KEY ("authorizedMembershipId", "workspaceId") REFERENCES "Membership"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleWatchChannel" ADD CONSTRAINT "GoogleWatchChannel_bindingId_workspaceId_fkey" FOREIGN KEY ("bindingId", "workspaceId") REFERENCES "GoogleBinding"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarPool" ADD CONSTRAINT "CalendarPool_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarPoolMember" ADD CONSTRAINT "CalendarPoolMember_poolId_workspaceId_fkey" FOREIGN KEY ("poolId", "workspaceId") REFERENCES "CalendarPool"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarPoolMember" ADD CONSTRAINT "CalendarPoolMember_membershipId_workspaceId_fkey" FOREIGN KEY ("membershipId", "workspaceId") REFERENCES "Membership"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarPoolMember" ADD CONSTRAINT "CalendarPoolMember_googleBindingId_workspaceId_fkey" FOREIGN KEY ("googleBindingId", "workspaceId") REFERENCES "GoogleBinding"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingType" ADD CONSTRAINT "MeetingType_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingType" ADD CONSTRAINT "MeetingType_calendarPoolId_workspaceId_fkey" FOREIGN KEY ("calendarPoolId", "workspaceId") REFERENCES "CalendarPool"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingType" ADD CONSTRAINT "MeetingType_stageOnBookId_workspaceId_fkey" FOREIGN KEY ("stageOnBookId", "workspaceId") REFERENCES "LeadStage"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadMeeting" ADD CONSTRAINT "LeadMeeting_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadMeeting" ADD CONSTRAINT "LeadMeeting_leadId_workspaceId_fkey" FOREIGN KEY ("leadId", "workspaceId") REFERENCES "Lead"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadMeeting" ADD CONSTRAINT "LeadMeeting_meetingTypeId_workspaceId_fkey" FOREIGN KEY ("meetingTypeId", "workspaceId") REFERENCES "MeetingType"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadMeeting" ADD CONSTRAINT "LeadMeeting_hostMembershipId_workspaceId_fkey" FOREIGN KEY ("hostMembershipId", "workspaceId") REFERENCES "Membership"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingLink" ADD CONSTRAINT "BookingLink_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingLink" ADD CONSTRAINT "BookingLink_leadId_workspaceId_fkey" FOREIGN KEY ("leadId", "workspaceId") REFERENCES "Lead"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingLink" ADD CONSTRAINT "BookingLink_meetingTypeId_workspaceId_fkey" FOREIGN KEY ("meetingTypeId", "workspaceId") REFERENCES "MeetingType"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingLink" ADD CONSTRAINT "BookingLink_meetingId_workspaceId_fkey" FOREIGN KEY ("meetingId", "workspaceId") REFERENCES "LeadMeeting"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotReservation" ADD CONSTRAINT "SlotReservation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotReservation" ADD CONSTRAINT "SlotReservation_googleBindingId_workspaceId_fkey" FOREIGN KEY ("googleBindingId", "workspaceId") REFERENCES "GoogleBinding"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotReservation" ADD CONSTRAINT "SlotReservation_meetingId_workspaceId_fkey" FOREIGN KEY ("meetingId", "workspaceId") REFERENCES "LeadMeeting"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetDestination" ADD CONSTRAINT "SheetDestination_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetDestination" ADD CONSTRAINT "SheetDestination_googleBindingId_workspaceId_fkey" FOREIGN KEY ("googleBindingId", "workspaceId") REFERENCES "GoogleBinding"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetDestination" ADD CONSTRAINT "SheetDestination_pipelineId_workspaceId_fkey" FOREIGN KEY ("pipelineId", "workspaceId") REFERENCES "LeadPipeline"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetColumnMapping" ADD CONSTRAINT "SheetColumnMapping_destinationId_workspaceId_fkey" FOREIGN KEY ("destinationId", "workspaceId") REFERENCES "SheetDestination"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetRowProjection" ADD CONSTRAINT "SheetRowProjection_destinationId_workspaceId_fkey" FOREIGN KEY ("destinationId", "workspaceId") REFERENCES "SheetDestination"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetRowProjection" ADD CONSTRAINT "SheetRowProjection_leadId_workspaceId_fkey" FOREIGN KEY ("leadId", "workspaceId") REFERENCES "Lead"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetSyncConflict" ADD CONSTRAINT "SheetSyncConflict_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetSyncConflict" ADD CONSTRAINT "SheetSyncConflict_destinationId_workspaceId_fkey" FOREIGN KEY ("destinationId", "workspaceId") REFERENCES "SheetDestination"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetSyncConflict" ADD CONSTRAINT "SheetSyncConflict_leadId_workspaceId_fkey" FOREIGN KEY ("leadId", "workspaceId") REFERENCES "Lead"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetSyncConflict" ADD CONSTRAINT "SheetSyncConflict_resolvedById_workspaceId_fkey" FOREIGN KEY ("resolvedById", "workspaceId") REFERENCES "Membership"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationOperation" ADD CONSTRAINT "IntegrationOperation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationOperation" ADD CONSTRAINT "IntegrationOperation_googleBindingId_workspaceId_fkey" FOREIGN KEY ("googleBindingId", "workspaceId") REFERENCES "GoogleBinding"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationAttempt" ADD CONSTRAINT "IntegrationAttempt_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "IntegrationOperation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxEvent" ADD CONSTRAINT "OutboxEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyRecord" ADD CONSTRAINT "IdempotencyRecord_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Scoped partner capture keys. Only the hash is retained.
CREATE TABLE "WorkspaceApiKey" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "API_KEY_STATUS" NOT NULL DEFAULT 'ACTIVE',
    "createdByMembershipId" UUID NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkspaceApiKey_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WorkspaceApiKey_secretHash_key" ON "WorkspaceApiKey"("secretHash");
CREATE UNIQUE INDEX "WorkspaceApiKey_workspaceId_keyPrefix_key" ON "WorkspaceApiKey"("workspaceId", "keyPrefix");
CREATE INDEX "WorkspaceApiKey_workspaceId_status_idx" ON "WorkspaceApiKey"("workspaceId", "status");
ALTER TABLE "WorkspaceApiKey" ADD CONSTRAINT "WorkspaceApiKey_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceApiKey" ADD CONSTRAINT "WorkspaceApiKey_createdByMembershipId_workspaceId_fkey" FOREIGN KEY ("createdByMembershipId", "workspaceId") REFERENCES "Membership"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "GoogleOAuthSession" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "authorizedMembershipId" UUID NOT NULL,
    "stateHash" TEXT NOT NULL,
    "codeVerifierEncrypted" TEXT NOT NULL,
    "ownership" "GOOGLE_BINDING_OWNERSHIP" NOT NULL,
    "capabilities" "GOOGLE_CAPABILITY"[] DEFAULT ARRAY[]::"GOOGLE_CAPABILITY"[],
    "requestedScopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "returnPath" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GoogleOAuthSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GoogleOAuthSession_stateHash_key" ON "GoogleOAuthSession"("stateHash");
CREATE INDEX "GoogleOAuthSession_workspaceId_expiresAt_idx" ON "GoogleOAuthSession"("workspaceId", "expiresAt");
ALTER TABLE "GoogleOAuthSession" ADD CONSTRAINT "GoogleOAuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoogleOAuthSession" ADD CONSTRAINT "GoogleOAuthSession_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoogleOAuthSession" ADD CONSTRAINT "GoogleOAuthSession_authorizedMembershipId_workspaceId_fkey" FOREIGN KEY ("authorizedMembershipId", "workspaceId") REFERENCES "Membership"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
