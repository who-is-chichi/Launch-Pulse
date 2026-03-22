-- CreateTable
CREATE TABLE "CrosswalkStat" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "statType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "matchRate" DOUBLE PRECISION NOT NULL,
    "unmatchedCount" INTEGER NOT NULL DEFAULT 0,
    "entityType" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrosswalkStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrosswalkStat_brandId_idx" ON "CrosswalkStat"("brandId");

-- AddForeignKey
ALTER TABLE "CrosswalkStat" ADD CONSTRAINT "CrosswalkStat_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
