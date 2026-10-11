-- Add parent-child self relation support for recurring events
ALTER TABLE "events"
ADD COLUMN "parentId" TEXT;

ALTER TABLE "events"
ADD CONSTRAINT "events_parentId_fkey"
FOREIGN KEY ("parentId") REFERENCES "events"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE INDEX "events_parentId_idx" ON "events"("parentId");
CREATE INDEX "events_organizerId_dateStart_idx" ON "events"("organizerId", "dateStart");
CREATE UNIQUE INDEX "events_parentId_dateStart_key" ON "events"("parentId", "dateStart");
