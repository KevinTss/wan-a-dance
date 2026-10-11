-- Replace event dance type join-table relation with an enum list on events.
ALTER TABLE "events"
ADD COLUMN "danceTypes" "DanceType"[] NOT NULL DEFAULT ARRAY[]::"DanceType"[];

WITH event_dance_types AS (
  SELECT
    edt."B" AS event_id,
    ARRAY_AGG(DISTINCT dt."type") AS dance_types
  FROM "_eventDanceTypes" edt
  JOIN "dance_types" dt ON dt."id" = edt."A"
  GROUP BY edt."B"
)
UPDATE "events" e
SET "danceTypes" = event_dance_types.dance_types
FROM event_dance_types
WHERE event_dance_types.event_id = e."id";

DROP TABLE "_eventDanceTypes";
