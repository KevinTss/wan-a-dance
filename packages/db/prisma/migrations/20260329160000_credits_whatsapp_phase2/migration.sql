-- CreateEnum
CREATE TYPE "RestorationStatus" AS ENUM ('NONE', 'PENDING', 'RESTORED', 'DENIED');

-- CreateEnum
CREATE TYPE "EntitlementKind" AS ENUM ('CREDIT_BALANCE', 'DROP_IN_PASS', 'COHORT_PASS', 'TRIAL_PASS');

-- CreateEnum
CREATE TYPE "EntitlementSource" AS ENUM ('PURCHASE', 'MANUAL_GRANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "EntitlementStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "EntitlementTransactionType" AS ENUM ('CREDIT', 'DEBIT', 'REVERSAL', 'EXPIRY');

-- CreateEnum
CREATE TYPE "ConversationChannel" AS ENUM ('WHATSAPP');

-- CreateEnum
CREATE TYPE "ConversationState" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEMPLATE', 'FREE_TEXT', 'INTERACTIVE');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "WhatsAppConversationCategory" AS ENUM ('UTILITY', 'MARKETING', 'SERVICE');

-- AlterTable
ALTER TABLE "attendees" ADD COLUMN     "cancelledAt" TIMESTAMPTZ(3),
ADD COLUMN     "cancelledById" TEXT,
ADD COLUMN     "consumedEntitlementId" TEXT,
ADD COLUMN     "restorationStatus" "RestorationStatus" NOT NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" "EntitlementKind" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "credits" INTEGER,
    "validityDays" INTEGER,
    "restrictedDanceTypes" "DanceType"[] DEFAULT ARRAY[]::"DanceType"[],
    "maxUsagePerWeek" INTEGER,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prices" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_cancellation_policies" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "fullRestoreBeforeHours" INTEGER,
    "partialRestoreBeforeHours" INTEGER,
    "partialRestorePercent" INTEGER,

    CONSTRAINT "workspace_cancellation_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_cancellation_policy_overrides" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "noRestore" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "event_cancellation_policy_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "priceId" TEXT,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMPTZ(3),
    "refundedAt" TIMESTAMPTZ(3),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "paidById" TEXT,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entitlement_grants" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "kind" "EntitlementKind" NOT NULL,
    "source" "EntitlementSource" NOT NULL,
    "status" "EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
    "creditsTotal" INTEGER NOT NULL DEFAULT 0,
    "creditsRemaining" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMPTZ(3) NOT NULL,
    "validUntil" TIMESTAMPTZ(3),
    "restrictedDanceTypes" "DanceType"[] DEFAULT ARRAY[]::"DanceType"[],
    "maxUsagePerWeek" INTEGER,
    "purchaseId" TEXT,
    "grantedById" TEXT,

    CONSTRAINT "entitlement_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entitlement_transactions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantId" TEXT NOT NULL,
    "type" "EntitlementTransactionType" NOT NULL,
    "delta" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "attendeeId" TEXT,
    "notes" TEXT,

    CONSTRAINT "entitlement_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "channel" "ConversationChannel" NOT NULL,
    "state" "ConversationState" NOT NULL DEFAULT 'OPEN',
    "lastMessageAt" TIMESTAMPTZ(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversationId" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "type" "MessageType" NOT NULL,
    "templateName" TEXT,
    "body" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "externalId" TEXT,
    "sentAt" TIMESTAMPTZ(3),
    "deliveredAt" TIMESTAMPTZ(3),
    "readAt" TIMESTAMPTZ(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_usage_records" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "category" "WhatsAppConversationCategory" NOT NULL,
    "conversationCount" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostEur" DECIMAL(10,4) NOT NULL DEFAULT 0,

    CONSTRAINT "whatsapp_usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_workspaceId_isActive_idx" ON "products"("workspaceId", "isActive");

-- CreateIndex
CREATE INDEX "prices_productId_isActive_idx" ON "prices"("productId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_cancellation_policies_workspaceId_key" ON "workspace_cancellation_policies"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "event_cancellation_policy_overrides_eventId_key" ON "event_cancellation_policy_overrides"("eventId");

-- CreateIndex
CREATE INDEX "purchases_workspaceId_memberId_idx" ON "purchases"("workspaceId", "memberId");

-- CreateIndex
CREATE INDEX "entitlement_grants_workspaceId_memberId_status_idx" ON "entitlement_grants"("workspaceId", "memberId", "status");

-- CreateIndex
CREATE INDEX "entitlement_transactions_grantId_idx" ON "entitlement_transactions"("grantId");

-- CreateIndex
CREATE INDEX "conversations_workspaceId_memberId_channel_idx" ON "conversations"("workspaceId", "memberId", "channel");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE INDEX "whatsapp_usage_records_workspaceId_month_idx" ON "whatsapp_usage_records"("workspaceId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_usage_records_workspaceId_month_category_key" ON "whatsapp_usage_records"("workspaceId", "month", "category");

-- AddForeignKey
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_consumedEntitlementId_fkey" FOREIGN KEY ("consumedEntitlementId") REFERENCES "entitlement_grants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_cancellation_policies" ADD CONSTRAINT "workspace_cancellation_policies_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_cancellation_policy_overrides" ADD CONSTRAINT "event_cancellation_policy_overrides_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_cancellation_policy_overrides" ADD CONSTRAINT "event_cancellation_policy_overrides_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "workspace_cancellation_policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "prices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlement_grants" ADD CONSTRAINT "entitlement_grants_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlement_grants" ADD CONSTRAINT "entitlement_grants_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlement_grants" ADD CONSTRAINT "entitlement_grants_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlement_transactions" ADD CONSTRAINT "entitlement_transactions_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "entitlement_grants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_usage_records" ADD CONSTRAINT "whatsapp_usage_records_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

