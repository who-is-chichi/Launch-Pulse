-- CreateTable
CREATE TABLE "TerritoryChangeLog" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "changeDate" TIMESTAMP(3) NOT NULL,
    "territory" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "affectedReps" INTEGER NOT NULL,
    "region" TEXT NOT NULL,

    CONSTRAINT "TerritoryChangeLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TerritoryChangeLog" ADD CONSTRAINT "TerritoryChangeLog_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
