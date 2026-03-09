-- CreateTable
CREATE TABLE "ClaimsMetricsFact" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "weekEnding" TIMESTAMP(3) NOT NULL,
    "dimension" TEXT NOT NULL,
    "dimensionType" TEXT NOT NULL,
    "nrxCount" INTEGER NOT NULL,
    "marketSharePct" DOUBLE PRECISION,
    "activePrescribers" INTEGER,

    CONSTRAINT "ClaimsMetricsFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpMetricsFact" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "pendingOutreachCount" INTEGER NOT NULL,
    "resolutionTimeMedian" DOUBLE PRECISION NOT NULL,
    "tttMedianDays" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SpMetricsFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallsMetricsFact" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "weekEnding" TIMESTAMP(3) NOT NULL,
    "territory" TEXT NOT NULL,
    "compliancePct" DOUBLE PRECISION NOT NULL,
    "repsTotal" INTEGER NOT NULL,
    "repsBelowThreshold" INTEGER NOT NULL,

    CONSTRAINT "CallsMetricsFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StructureChangeLog" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "eventType" TEXT NOT NULL,
    "payerName" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "coveredLives" INTEGER NOT NULL,

    CONSTRAINT "StructureChangeLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ClaimsMetricsFact" ADD CONSTRAINT "ClaimsMetricsFact_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpMetricsFact" ADD CONSTRAINT "SpMetricsFact_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallsMetricsFact" ADD CONSTRAINT "CallsMetricsFact_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureChangeLog" ADD CONSTRAINT "StructureChangeLog_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
