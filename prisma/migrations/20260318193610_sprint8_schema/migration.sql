/*
  Warnings:

  - Made the column `orgId` on table `Brand` required. This step will fail if there are existing NULL values in that column.

*/
-- Backfill NULL orgId values before making the column NOT NULL
UPDATE "Brand" SET "orgId" = 'org_default' WHERE "orgId" IS NULL;

-- AlterTable
ALTER TABLE "Brand" ALTER COLUMN "orgId" SET NOT NULL,
ALTER COLUMN "orgId" SET DEFAULT 'org_default';

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notifyHighSeverity" BOOLEAN NOT NULL DEFAULT true,
    "notifyActionsDue" BOOLEAN NOT NULL DEFAULT true,
    "notifyWeeklySummary" BOOLEAN NOT NULL DEFAULT false,
    "notifyDataFreshness" BOOLEAN NOT NULL DEFAULT true,
    "defaultBrand" TEXT NOT NULL DEFAULT 'ONC-101',
    "defaultTimeWindow" TEXT NOT NULL DEFAULT 'Last 7 days',
    "defaultGeography" TEXT NOT NULL DEFAULT 'Nation',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");
