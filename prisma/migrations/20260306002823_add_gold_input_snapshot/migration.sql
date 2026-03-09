-- CreateTable
CREATE TABLE "GoldInputSnapshot" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "dataRunId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "metric" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "dimensionType" TEXT NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "priorValue" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "GoldInputSnapshot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GoldInputSnapshot" ADD CONSTRAINT "GoldInputSnapshot_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoldInputSnapshot" ADD CONSTRAINT "GoldInputSnapshot_dataRunId_fkey" FOREIGN KEY ("dataRunId") REFERENCES "DataRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
