CREATE TYPE "QUALIFICATION_SESSION_STATUS" AS ENUM ('ACTIVE', 'WAITING_INPUT', 'COMPLETED', 'PAUSED', 'EXPIRED', 'FAILED');

CREATE TABLE "QualificationSession" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspaceId" UUID NOT NULL,
  "leadId" UUID NOT NULL,
  "status" "QUALIFICATION_SESSION_STATUS" NOT NULL DEFAULT 'ACTIVE',
  "policyVersion" INTEGER NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "pausedAt" TIMESTAMP(3),
  "failureCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QualificationSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QualificationSession_id_workspaceId_key" ON "QualificationSession"("id", "workspaceId");
CREATE INDEX "QualificationSession_workspaceId_status_expiresAt_idx" ON "QualificationSession"("workspaceId", "status", "expiresAt");
CREATE INDEX "QualificationSession_leadId_createdAt_idx" ON "QualificationSession"("leadId", "createdAt" DESC);

ALTER TABLE "QualificationSession" ADD CONSTRAINT "QualificationSession_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QualificationSession" ADD CONSTRAINT "QualificationSession_leadId_workspaceId_fkey"
FOREIGN KEY ("leadId", "workspaceId") REFERENCES "Lead"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "QualificationSession_one_live_per_lead_key"
ON "QualificationSession"("workspaceId", "leadId")
WHERE "status" IN ('ACTIVE', 'WAITING_INPUT', 'PAUSED');
