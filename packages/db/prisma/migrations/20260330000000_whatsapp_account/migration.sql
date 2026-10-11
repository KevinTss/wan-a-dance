-- Add WHATSAPP to AccountProvider enum
ALTER TYPE "AccountProvider" ADD VALUE 'WHATSAPP';

-- Make email nullable on accounts (WHATSAPP accounts have no email)
ALTER TABLE "accounts" ALTER COLUMN "email" DROP NOT NULL;

-- Add WhatsApp fields to accounts
ALTER TABLE "accounts"
  ADD COLUMN "phone"              TEXT,
  ADD COLUMN "whatsappOptedInAt"  TIMESTAMPTZ(3),
  ADD COLUMN "whatsappOptedOutAt" TIMESTAMPTZ(3);

-- Migrate existing whatsappPhone from users → create WHATSAPP Account rows
INSERT INTO "accounts" ("id", "createdAt", "updatedAt", "provider", "phone", "userId")
SELECT gen_random_uuid(), now(), now(), 'WHATSAPP', "whatsappPhone", "id"
FROM "users"
WHERE "whatsappPhone" IS NOT NULL;

-- Drop whatsappPhone from users
ALTER TABLE "users" DROP COLUMN "whatsappPhone";

-- Drop per-workspace WhatsApp consent fields from members (consent now lives on Account)
ALTER TABLE "members"
  DROP COLUMN IF EXISTS "whatsappOptedInAt",
  DROP COLUMN IF EXISTS "whatsappOptedOutAt";

-- Add unique constraint on (userId, provider)
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_provider_key" UNIQUE ("userId", "provider");
