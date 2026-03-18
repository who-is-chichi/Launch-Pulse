-- DropIndex
DROP INDEX "User_email_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 1;
