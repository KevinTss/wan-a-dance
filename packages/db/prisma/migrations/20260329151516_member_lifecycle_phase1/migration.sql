-- CreateEnum
CREATE TYPE "AcquisitionSource" AS ENUM ('PUBLIC_EVENT', 'TRIAL_CLASS', 'MANUAL', 'INVITATION');

-- AlterEnum
-- Adding new values to MemberStatus.
-- PostgreSQL requires these to be committed before being used as column defaults.
-- We add the enum values first, then use them in subsequent statements.
ALTER TYPE "MemberStatus" ADD VALUE 'LEAD';
ALTER TYPE "MemberStatus" ADD VALUE 'TRIAL';
ALTER TYPE "MemberStatus" ADD VALUE 'LAPSED';

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "isTrial" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: add status as nullable first (enum value must be committed before using as DEFAULT)
ALTER TABLE "members" ADD COLUMN     "acquisitionEventId" TEXT,
ADD COLUMN     "acquisitionSource" "AcquisitionSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "status" "MemberStatus",
ADD COLUMN     "statusUpdatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "whatsappOptedInAt" TIMESTAMPTZ(3),
ADD COLUMN     "whatsappOptedOutAt" TIMESTAMPTZ(3),
ADD COLUMN     "whatsappPhone" TEXT;

-- Backfill existing members as ACTIVE (they were manually enrolled)
UPDATE "members" SET "status" = 'ACTIVE' WHERE "status" IS NULL;

-- Set NOT NULL constraint and default now that enum value is committed and column is populated
ALTER TABLE "members" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "members" ALTER COLUMN "status" SET DEFAULT 'LEAD';

-- AlterTable
ALTER TABLE "workspaceConfig" ADD COLUMN     "autoCreateLeads" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "member_status_history" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" TEXT NOT NULL,
    "fromStatus" "MemberStatus",
    "toStatus" "MemberStatus" NOT NULL,
    "reason" TEXT,
    "triggeredBy" TEXT,

    CONSTRAINT "member_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "member_status_history_memberId_idx" ON "member_status_history"("memberId");

-- CreateIndex
CREATE INDEX "members_workspaceId_status_idx" ON "members"("workspaceId", "status");

-- AddForeignKey
ALTER TABLE "member_status_history" ADD CONSTRAINT "member_status_history_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
