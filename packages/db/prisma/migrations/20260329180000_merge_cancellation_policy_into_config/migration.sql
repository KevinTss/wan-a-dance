-- AlterTable: add policy columns to workspaceConfig
ALTER TABLE "workspaceConfig"
ADD COLUMN "fullRestoreBeforeHours"    INTEGER,
ADD COLUMN "partialRestoreBeforeHours" INTEGER,
ADD COLUMN "partialRestorePercent"     INTEGER;

-- Migrate existing policy data into workspaceConfig
UPDATE "workspaceConfig" wc
SET
  "fullRestoreBeforeHours"    = wcp."fullRestoreBeforeHours",
  "partialRestoreBeforeHours" = wcp."partialRestoreBeforeHours",
  "partialRestorePercent"     = wcp."partialRestorePercent"
FROM "workspace_cancellation_policies" wcp
WHERE wc."workspaceId" = wcp."workspaceId";

-- DropForeignKey
ALTER TABLE "event_cancellation_policy_overrides" DROP CONSTRAINT "event_cancellation_policy_overrides_policyId_fkey";

-- AlterTable: remove policyId from overrides
ALTER TABLE "event_cancellation_policy_overrides" DROP COLUMN "policyId";

-- DropForeignKey
ALTER TABLE "workspace_cancellation_policies" DROP CONSTRAINT "workspace_cancellation_policies_workspaceId_fkey";

-- DropTable
DROP TABLE "workspace_cancellation_policies";
