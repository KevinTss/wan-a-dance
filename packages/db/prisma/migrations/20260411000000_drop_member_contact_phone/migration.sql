-- Merge contactPhone into phone for walk-in members that had contactPhone set
-- but no phone yet (idempotent: if phone was already set, keep it)
UPDATE "members"
SET "phone" = "contactPhone"
WHERE "contactPhone" IS NOT NULL
  AND "phone" IS NULL;

-- Drop the redundant contactPhone column
ALTER TABLE "members" DROP COLUMN IF EXISTS "contactPhone";
