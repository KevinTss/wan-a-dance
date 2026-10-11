-- Add canonical MemberLevel enum and per-dance level assignments for members.

-- CreateEnum
CREATE TYPE "MemberLevel" AS ENUM ('STARTER', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateTable
CREATE TABLE "member_dance_levels" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "memberId" TEXT NOT NULL,
    "danceType" "DanceType" NOT NULL,
    "level" "MemberLevel" NOT NULL,
    "assignedById" TEXT NOT NULL,
    "assignedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "member_dance_levels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "member_dance_levels_danceType_level_idx" ON "member_dance_levels"("danceType", "level");

-- CreateIndex
CREATE INDEX "member_dance_levels_memberId_idx" ON "member_dance_levels"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "member_dance_levels_memberId_danceType_key" ON "member_dance_levels"("memberId", "danceType");

-- AddForeignKey
ALTER TABLE "member_dance_levels" ADD CONSTRAINT "member_dance_levels_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_dance_levels" ADD CONSTRAINT "member_dance_levels_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
