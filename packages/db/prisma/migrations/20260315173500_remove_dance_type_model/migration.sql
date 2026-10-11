-- Remove DanceType table/model and persist values as enums on dependent tables.

-- WorkspaceConfig: move many-to-many dance types to enum[] column.
ALTER TABLE "workspaceConfig"
ADD COLUMN "danceTypes" "DanceType"[] NOT NULL DEFAULT ARRAY[]::"DanceType"[];

WITH workspace_dance_types AS (
  SELECT
    wdt."B" AS workspace_config_id,
    ARRAY_AGG(DISTINCT dt."type") AS dance_types
  FROM "_workspaceDanceTypes" wdt
  JOIN "dance_types" dt ON dt."id" = wdt."A"
  GROUP BY wdt."B"
)
UPDATE "workspaceConfig" wc
SET "danceTypes" = workspace_dance_types.dance_types
FROM workspace_dance_types
WHERE workspace_dance_types.workspace_config_id = wc."id";

-- Materials: replace danceTypeId foreign key with enum column.
ALTER TABLE "materials"
ADD COLUMN "danceType" "DanceType";

UPDATE "materials" m
SET "danceType" = dt."type"
FROM "dance_types" dt
WHERE m."danceTypeId" = dt."id";

ALTER TABLE "materials"
DROP CONSTRAINT IF EXISTS "materials_danceTypeId_fkey";

ALTER TABLE "materials"
DROP COLUMN "danceTypeId";

-- Remove obsolete tables now that data has been migrated.
DROP TABLE IF EXISTS "_workspaceDanceTypes";
DROP TABLE IF EXISTS "dance_types";

-- This enum was only used by dance_types.
DROP TYPE IF EXISTS "DanceCategory";
