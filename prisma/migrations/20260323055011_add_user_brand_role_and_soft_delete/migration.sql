-- AlterTable
ALTER TABLE "Action" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "UserBrandRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,

    CONSTRAINT "UserBrandRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserBrandRole_userId_idx" ON "UserBrandRole"("userId");

-- CreateIndex
CREATE INDEX "UserBrandRole_brandId_idx" ON "UserBrandRole"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBrandRole_userId_brandId_key" ON "UserBrandRole"("userId", "brandId");

-- AddForeignKey
ALTER TABLE "UserBrandRole" ADD CONSTRAINT "UserBrandRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBrandRole" ADD CONSTRAINT "UserBrandRole_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
