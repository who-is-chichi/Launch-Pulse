-- AlterTable
ALTER TABLE "Action" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "ownerRole" TEXT;

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "ImpactScore" ADD COLUMN     "autoEvaluated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "baselineDataRunId" TEXT,
ADD COLUMN     "baselineValue" DOUBLE PRECISION,
ADD COLUMN     "currentValue" DOUBLE PRECISION,
ADD COLUMN     "evaluatedDataRunId" TEXT,
ADD COLUMN     "metricKey" TEXT;

-- AlterTable
ALTER TABLE "Insight" ADD COLUMN     "createdBy" TEXT;
