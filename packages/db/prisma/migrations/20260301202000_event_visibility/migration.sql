-- Add event visibility level (PRIVATE / WORKSPACE / PUBLIC)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EventVisibility') THEN
        CREATE TYPE "EventVisibility" AS ENUM ('PRIVATE', 'WORKSPACE', 'PUBLIC');
    END IF;
END
$$;

ALTER TABLE "events"
ADD COLUMN "visibility" "EventVisibility" NOT NULL DEFAULT 'WORKSPACE';
