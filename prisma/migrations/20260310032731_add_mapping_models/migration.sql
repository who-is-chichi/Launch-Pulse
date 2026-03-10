-- CreateTable
CREATE TABLE "MappingConfig" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "dataset" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Configured',
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MappingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NormalizationRule" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL DEFAULT 'sp_status',
    "hubValue" TEXT NOT NULL,
    "normalizedValue" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NormalizationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishedMapping" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dataset" TEXT NOT NULL,
    "publishedBy" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fieldCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublishedMapping_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MappingConfig" ADD CONSTRAINT "MappingConfig_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NormalizationRule" ADD CONSTRAINT "NormalizationRule_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishedMapping" ADD CONSTRAINT "PublishedMapping_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
