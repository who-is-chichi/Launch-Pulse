-- CreateTable
CREATE TABLE "BronzeCtlIngestionRun" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "brandId" TEXT,
    "runType" TEXT NOT NULL DEFAULT 'full',
    "sourceSystem" TEXT NOT NULL,
    "sourceFeedName" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL DEFAULT 'api',
    "pipelineVersion" TEXT,
    "orchestratorJobId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'running',
    "filesDetected" INTEGER NOT NULL DEFAULT 0,
    "filesLoaded" INTEGER NOT NULL DEFAULT 0,
    "recordsRead" BIGINT NOT NULL DEFAULT 0,
    "recordsLoaded" BIGINT NOT NULL DEFAULT 0,
    "recordsRejected" BIGINT NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errorSummary" TEXT,
    "metadata" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BronzeCtlIngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BronzeCtlFileManifest" (
    "id" TEXT NOT NULL,
    "ingestionRunId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "brandId" TEXT,
    "sourceSystem" TEXT NOT NULL,
    "sourceFeedName" TEXT NOT NULL,
    "brandCode" TEXT,
    "sourceFileName" TEXT NOT NULL,
    "sourceFilePath" TEXT NOT NULL DEFAULT '',
    "fileType" TEXT NOT NULL DEFAULT 'json',
    "compressionType" TEXT,
    "fileSizeBytes" BIGINT,
    "checksumMd5" TEXT,
    "checksumSha256" TEXT,
    "sourceFileDate" TIMESTAMP(3),
    "sourceDropTs" TIMESTAMP(3),
    "receivedTs" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "headerRow" JSONB,
    "rowCountRaw" BIGINT,
    "rowCountLoaded" BIGINT NOT NULL DEFAULT 0,
    "rowCountRejected" BIGINT NOT NULL DEFAULT 0,
    "schemaVersionDetected" TEXT,
    "status" TEXT NOT NULL DEFAULT 'received',
    "errorSummary" TEXT,
    "archivedFlag" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BronzeCtlFileManifest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BronzeCtlRowRejection" (
    "id" TEXT NOT NULL,
    "ingestionRunId" TEXT NOT NULL,
    "fileManifestId" TEXT,
    "clientId" TEXT NOT NULL,
    "brandId" TEXT,
    "sourceSystem" TEXT NOT NULL,
    "sourceFeedName" TEXT NOT NULL,
    "datasetName" TEXT NOT NULL,
    "sourceFileName" TEXT,
    "sourceRowNumber" BIGINT,
    "sourcePrimaryKey" TEXT,
    "rejectionStage" TEXT NOT NULL,
    "rejectionCode" TEXT NOT NULL,
    "rejectionReason" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BronzeCtlRowRejection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BronzeCtlSchemaRegistry" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "brandId" TEXT,
    "sourceSystem" TEXT NOT NULL,
    "sourceFeedName" TEXT NOT NULL,
    "datasetName" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "columnDefinitions" JSONB NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeFlag" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "BronzeCtlSchemaRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BronzeCtlMappingValidationIssue" (
    "id" TEXT NOT NULL,
    "ingestionRunId" TEXT NOT NULL,
    "fileManifestId" TEXT,
    "clientId" TEXT NOT NULL,
    "brandId" TEXT,
    "datasetName" TEXT NOT NULL,
    "issueLevel" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "sourceColumnName" TEXT,
    "targetFieldName" TEXT,
    "issueMessage" TEXT NOT NULL,
    "issueDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BronzeCtlMappingValidationIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BronzeCtlUnmappedFieldsRegistry" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "brandId" TEXT,
    "datasetName" TEXT NOT NULL,
    "sourceSystem" TEXT NOT NULL,
    "sourceFeedName" TEXT NOT NULL,
    "fileManifestId" TEXT,
    "sourceColumnName" TEXT NOT NULL,
    "sampleValues" JSONB,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'unreviewed',
    "notes" TEXT,

    CONSTRAINT "BronzeCtlUnmappedFieldsRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BronzeClaimsRaw" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "brandId" TEXT,
    "datasetName" TEXT NOT NULL DEFAULT 'claims',
    "sourceSystem" TEXT NOT NULL,
    "sourceFeedName" TEXT NOT NULL,
    "ingestionRunId" TEXT NOT NULL,
    "fileManifestId" TEXT,
    "sourceFileName" TEXT,
    "sourceFilePath" TEXT,
    "sourceRowNumber" BIGINT,
    "sourcePrimaryKey" TEXT,
    "sourceExtractTs" TIMESTAMP(3),
    "sourceRecordTs" TIMESTAMP(3),
    "opType" TEXT,
    "isDeletedFlag" BOOLEAN NOT NULL DEFAULT false,
    "schemaVersion" TEXT,
    "recordHash" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "parseStatus" TEXT NOT NULL DEFAULT 'parsed',
    "parseErrorCode" TEXT,
    "parseErrorDetail" TEXT,
    "partitionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimId" TEXT,
    "claimLineId" TEXT,
    "patientToken" TEXT,
    "patientAgeBand" TEXT,
    "patientGender" TEXT,
    "payerChannel" TEXT,
    "payerNameRaw" TEXT,
    "planNameRaw" TEXT,
    "planIdRaw" TEXT,
    "pbmNameRaw" TEXT,
    "drugNameRaw" TEXT,
    "brandNameRaw" TEXT,
    "ndc11" TEXT,
    "trxNrxFlag" TEXT,
    "rxFillNumber" INTEGER,
    "quantity" DECIMAL(18,4),
    "daysSupply" INTEGER,
    "writtenDate" TIMESTAMP(3),
    "fillDate" TIMESTAMP(3),
    "serviceDate" TIMESTAMP(3),
    "prescriberNpiRaw" TEXT,
    "prescriberIdRaw" TEXT,
    "hcpNameRaw" TEXT,
    "hcoIdRaw" TEXT,
    "hcoNameRaw" TEXT,
    "specialtyRaw" TEXT,
    "zip3" TEXT,
    "zip5" TEXT,
    "stateCode" TEXT,
    "territoryCodeRaw" TEXT,
    "claimStatusRaw" TEXT,
    "rejectionCodeRaw" TEXT,
    "rejectionReasonRaw" TEXT,
    "paidAmountRaw" DECIMAL(18,4),
    "copayAmountRaw" DECIMAL(18,4),
    "sourceLastUpdatedTs" TIMESTAMP(3),

    CONSTRAINT "BronzeClaimsRaw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BronzeSpCasesRaw" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "brandId" TEXT,
    "datasetName" TEXT NOT NULL DEFAULT 'sp_cases',
    "sourceSystem" TEXT NOT NULL,
    "sourceFeedName" TEXT NOT NULL,
    "ingestionRunId" TEXT NOT NULL,
    "fileManifestId" TEXT,
    "sourceFileName" TEXT,
    "sourceFilePath" TEXT,
    "sourceRowNumber" BIGINT,
    "sourcePrimaryKey" TEXT,
    "sourceExtractTs" TIMESTAMP(3),
    "sourceRecordTs" TIMESTAMP(3),
    "opType" TEXT,
    "isDeletedFlag" BOOLEAN NOT NULL DEFAULT false,
    "schemaVersion" TEXT,
    "recordHash" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "parseStatus" TEXT NOT NULL DEFAULT 'parsed',
    "parseErrorCode" TEXT,
    "parseErrorDetail" TEXT,
    "partitionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "spCaseId" TEXT,
    "referralId" TEXT,
    "patientToken" TEXT,
    "prescriberNpiRaw" TEXT,
    "prescriberIdRaw" TEXT,
    "hcpNameRaw" TEXT,
    "hcoIdRaw" TEXT,
    "hcoNameRaw" TEXT,
    "brandNameRaw" TEXT,
    "drugNameRaw" TEXT,
    "caseStatusRaw" TEXT,
    "caseSubstatusRaw" TEXT,
    "casePriorityRaw" TEXT,
    "referralDate" TIMESTAMP(3),
    "intakeDate" TIMESTAMP(3),
    "bvStartDate" TIMESTAMP(3),
    "bvCompleteDate" TIMESTAMP(3),
    "paStartDate" TIMESTAMP(3),
    "paOutcomeDate" TIMESTAMP(3),
    "patientOutreachDate" TIMESTAMP(3),
    "approvalDate" TIMESTAMP(3),
    "firstDispenseDateRaw" TIMESTAMP(3),
    "shipmentDateRaw" TIMESTAMP(3),
    "abandonmentDate" TIMESTAMP(3),
    "closureDate" TIMESTAMP(3),
    "hubVendorRaw" TEXT,
    "pharmacyNameRaw" TEXT,
    "pharmacyIdRaw" TEXT,
    "payerNameRaw" TEXT,
    "planNameRaw" TEXT,
    "planIdRaw" TEXT,
    "rejectionReasonRaw" TEXT,
    "supportProgramRaw" TEXT,
    "sourceLastUpdatedTs" TIMESTAMP(3),

    CONSTRAINT "BronzeSpCasesRaw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BronzeSpStatusHistoryRaw" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "brandId" TEXT,
    "datasetName" TEXT NOT NULL DEFAULT 'sp_status_history',
    "sourceSystem" TEXT NOT NULL,
    "sourceFeedName" TEXT NOT NULL,
    "ingestionRunId" TEXT NOT NULL,
    "fileManifestId" TEXT,
    "sourceFileName" TEXT,
    "sourceFilePath" TEXT,
    "sourceRowNumber" BIGINT,
    "sourcePrimaryKey" TEXT,
    "sourceExtractTs" TIMESTAMP(3),
    "sourceRecordTs" TIMESTAMP(3),
    "opType" TEXT,
    "isDeletedFlag" BOOLEAN NOT NULL DEFAULT false,
    "schemaVersion" TEXT,
    "recordHash" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "parseStatus" TEXT NOT NULL DEFAULT 'parsed',
    "parseErrorCode" TEXT,
    "parseErrorDetail" TEXT,
    "partitionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "spStatusEventId" TEXT,
    "spCaseId" TEXT,
    "statusRaw" TEXT,
    "substatusRaw" TEXT,
    "statusEffectiveTs" TIMESTAMP(3),
    "statusEndTs" TIMESTAMP(3),
    "changedByRaw" TEXT,
    "changeReasonRaw" TEXT,
    "eventSequence" INTEGER,
    "sourceLastUpdatedTs" TIMESTAMP(3),

    CONSTRAINT "BronzeSpStatusHistoryRaw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BronzeDispenseRaw" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "brandId" TEXT,
    "datasetName" TEXT NOT NULL DEFAULT 'dispense',
    "sourceSystem" TEXT NOT NULL,
    "sourceFeedName" TEXT NOT NULL,
    "ingestionRunId" TEXT NOT NULL,
    "fileManifestId" TEXT,
    "sourceFileName" TEXT,
    "sourceFilePath" TEXT,
    "sourceRowNumber" BIGINT,
    "sourcePrimaryKey" TEXT,
    "sourceExtractTs" TIMESTAMP(3),
    "sourceRecordTs" TIMESTAMP(3),
    "opType" TEXT,
    "isDeletedFlag" BOOLEAN NOT NULL DEFAULT false,
    "schemaVersion" TEXT,
    "recordHash" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "parseStatus" TEXT NOT NULL DEFAULT 'parsed',
    "parseErrorCode" TEXT,
    "parseErrorDetail" TEXT,
    "partitionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispenseId" TEXT,
    "spCaseId" TEXT,
    "patientToken" TEXT,
    "prescriberNpiRaw" TEXT,
    "ndc11" TEXT,
    "brandNameRaw" TEXT,
    "dispenseDate" TIMESTAMP(3),
    "shipDate" TIMESTAMP(3),
    "fillNumber" INTEGER,
    "quantity" DECIMAL(18,4),
    "daysSupply" INTEGER,
    "dispensingPharmacyIdRaw" TEXT,
    "dispensingPharmacyNameRaw" TEXT,
    "dispenseStatusRaw" TEXT,
    "dispenseChannelRaw" TEXT,
    "sourceLastUpdatedTs" TIMESTAMP(3),

    CONSTRAINT "BronzeDispenseRaw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BronzeShipmentsRaw" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "brandId" TEXT,
    "datasetName" TEXT NOT NULL DEFAULT 'shipments',
    "sourceSystem" TEXT NOT NULL,
    "sourceFeedName" TEXT NOT NULL,
    "ingestionRunId" TEXT NOT NULL,
    "fileManifestId" TEXT,
    "sourceFileName" TEXT,
    "sourceFilePath" TEXT,
    "sourceRowNumber" BIGINT,
    "sourcePrimaryKey" TEXT,
    "sourceExtractTs" TIMESTAMP(3),
    "sourceRecordTs" TIMESTAMP(3),
    "opType" TEXT,
    "isDeletedFlag" BOOLEAN NOT NULL DEFAULT false,
    "schemaVersion" TEXT,
    "recordHash" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "parseStatus" TEXT NOT NULL DEFAULT 'parsed',
    "parseErrorCode" TEXT,
    "parseErrorDetail" TEXT,
    "partitionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shipmentId" TEXT,
    "spCaseId" TEXT,
    "orderIdRaw" TEXT,
    "patientToken" TEXT,
    "brandNameRaw" TEXT,
    "ndc11" TEXT,
    "shipmentDate" TIMESTAMP(3),
    "deliveryDateRaw" TIMESTAMP(3),
    "shipmentStatusRaw" TEXT,
    "shipmentQuantity" DECIMAL(18,4),
    "daysSupplyRaw" INTEGER,
    "shippingPharmacyIdRaw" TEXT,
    "shippingPharmacyNameRaw" TEXT,
    "carrierRaw" TEXT,
    "trackingNumberRaw" TEXT,
    "sourceLastUpdatedTs" TIMESTAMP(3),

    CONSTRAINT "BronzeShipmentsRaw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BronzeCallsRaw" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "brandId" TEXT,
    "datasetName" TEXT NOT NULL DEFAULT 'calls',
    "sourceSystem" TEXT NOT NULL,
    "sourceFeedName" TEXT NOT NULL,
    "ingestionRunId" TEXT NOT NULL,
    "fileManifestId" TEXT,
    "sourceFileName" TEXT,
    "sourceFilePath" TEXT,
    "sourceRowNumber" BIGINT,
    "sourcePrimaryKey" TEXT,
    "sourceExtractTs" TIMESTAMP(3),
    "sourceRecordTs" TIMESTAMP(3),
    "opType" TEXT,
    "isDeletedFlag" BOOLEAN NOT NULL DEFAULT false,
    "schemaVersion" TEXT,
    "recordHash" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "parseStatus" TEXT NOT NULL DEFAULT 'parsed',
    "parseErrorCode" TEXT,
    "parseErrorDetail" TEXT,
    "partitionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "callId" TEXT,
    "interactionIdRaw" TEXT,
    "repIdRaw" TEXT,
    "repEmailRaw" TEXT,
    "repNameRaw" TEXT,
    "managerIdRaw" TEXT,
    "territoryCodeRaw" TEXT,
    "territoryNameRaw" TEXT,
    "prescriberNpiRaw" TEXT,
    "hcpIdRaw" TEXT,
    "hcoIdRaw" TEXT,
    "callDate" TIMESTAMP(3),
    "callTs" TIMESTAMP(3),
    "callTypeRaw" TEXT,
    "channelRaw" TEXT,
    "callStatusRaw" TEXT,
    "callPlanFlagRaw" BOOLEAN,
    "callDurationMinutesRaw" DECIMAL(10,2),
    "productDiscussedRaw" TEXT,
    "detailPriorityRaw" TEXT,
    "sampleFlagRaw" BOOLEAN,
    "speakerProgramFlagRaw" BOOLEAN,
    "sourceLastUpdatedTs" TIMESTAMP(3),

    CONSTRAINT "BronzeCallsRaw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BronzeHcpMasterRaw" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "brandId" TEXT,
    "datasetName" TEXT NOT NULL DEFAULT 'hcp_master',
    "sourceSystem" TEXT NOT NULL,
    "sourceFeedName" TEXT NOT NULL,
    "ingestionRunId" TEXT NOT NULL,
    "fileManifestId" TEXT,
    "sourceFileName" TEXT,
    "sourceFilePath" TEXT,
    "sourceRowNumber" BIGINT,
    "sourcePrimaryKey" TEXT,
    "sourceExtractTs" TIMESTAMP(3),
    "sourceRecordTs" TIMESTAMP(3),
    "opType" TEXT,
    "isDeletedFlag" BOOLEAN NOT NULL DEFAULT false,
    "schemaVersion" TEXT,
    "recordHash" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "parseStatus" TEXT NOT NULL DEFAULT 'parsed',
    "parseErrorCode" TEXT,
    "parseErrorDetail" TEXT,
    "partitionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hcpSourceId" TEXT,
    "npi" TEXT,
    "firstNameRaw" TEXT,
    "lastNameRaw" TEXT,
    "middleNameRaw" TEXT,
    "fullNameRaw" TEXT,
    "specialtyRaw" TEXT,
    "specialtyGroupRaw" TEXT,
    "designationRaw" TEXT,
    "emailRaw" TEXT,
    "phoneRaw" TEXT,
    "addressLine1Raw" TEXT,
    "addressLine2Raw" TEXT,
    "cityRaw" TEXT,
    "stateCodeRaw" TEXT,
    "zip5Raw" TEXT,
    "zip3Raw" TEXT,
    "countryRaw" TEXT,
    "statusRaw" TEXT,
    "deceasedFlagRaw" BOOLEAN,
    "sourceLastUpdatedTs" TIMESTAMP(3),

    CONSTRAINT "BronzeHcpMasterRaw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BronzeHcoMasterRaw" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "brandId" TEXT,
    "datasetName" TEXT NOT NULL DEFAULT 'hco_master',
    "sourceSystem" TEXT NOT NULL,
    "sourceFeedName" TEXT NOT NULL,
    "ingestionRunId" TEXT NOT NULL,
    "fileManifestId" TEXT,
    "sourceFileName" TEXT,
    "sourceFilePath" TEXT,
    "sourceRowNumber" BIGINT,
    "sourcePrimaryKey" TEXT,
    "sourceExtractTs" TIMESTAMP(3),
    "sourceRecordTs" TIMESTAMP(3),
    "opType" TEXT,
    "isDeletedFlag" BOOLEAN NOT NULL DEFAULT false,
    "schemaVersion" TEXT,
    "recordHash" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "parseStatus" TEXT NOT NULL DEFAULT 'parsed',
    "parseErrorCode" TEXT,
    "parseErrorDetail" TEXT,
    "partitionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hcoSourceId" TEXT,
    "accountIdRaw" TEXT,
    "accountNameRaw" TEXT,
    "accountTypeRaw" TEXT,
    "siteOfCareRaw" TEXT,
    "hospitalFlagRaw" BOOLEAN,
    "idnFlagRaw" BOOLEAN,
    "addressLine1Raw" TEXT,
    "addressLine2Raw" TEXT,
    "cityRaw" TEXT,
    "stateCodeRaw" TEXT,
    "zip5Raw" TEXT,
    "zip3Raw" TEXT,
    "countryRaw" TEXT,
    "statusRaw" TEXT,
    "sourceLastUpdatedTs" TIMESTAMP(3),

    CONSTRAINT "BronzeHcoMasterRaw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BronzeAffiliationsRaw" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "brandId" TEXT,
    "datasetName" TEXT NOT NULL DEFAULT 'affiliations',
    "sourceSystem" TEXT NOT NULL,
    "sourceFeedName" TEXT NOT NULL,
    "ingestionRunId" TEXT NOT NULL,
    "fileManifestId" TEXT,
    "sourceFileName" TEXT,
    "sourceFilePath" TEXT,
    "sourceRowNumber" BIGINT,
    "sourcePrimaryKey" TEXT,
    "sourceExtractTs" TIMESTAMP(3),
    "sourceRecordTs" TIMESTAMP(3),
    "opType" TEXT,
    "isDeletedFlag" BOOLEAN NOT NULL DEFAULT false,
    "schemaVersion" TEXT,
    "recordHash" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "parseStatus" TEXT NOT NULL DEFAULT 'parsed',
    "parseErrorCode" TEXT,
    "parseErrorDetail" TEXT,
    "partitionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "affiliationRecordId" TEXT,
    "childEntityIdRaw" TEXT,
    "childEntityTypeRaw" TEXT,
    "parentEntityIdRaw" TEXT,
    "parentEntityTypeRaw" TEXT,
    "relationshipTypeRaw" TEXT,
    "primaryAffiliationFlagRaw" BOOLEAN,
    "ownershipPctRaw" DOUBLE PRECISION,
    "effectiveStartDate" TIMESTAMP(3),
    "effectiveEndDate" TIMESTAMP(3),
    "activeFlagRaw" BOOLEAN,
    "sourceLastUpdatedTs" TIMESTAMP(3),

    CONSTRAINT "BronzeAffiliationsRaw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BronzeTerritoryAlignmentRaw" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "brandId" TEXT,
    "datasetName" TEXT NOT NULL DEFAULT 'territory_alignment',
    "sourceSystem" TEXT NOT NULL,
    "sourceFeedName" TEXT NOT NULL,
    "ingestionRunId" TEXT NOT NULL,
    "fileManifestId" TEXT,
    "sourceFileName" TEXT,
    "sourceFilePath" TEXT,
    "sourceRowNumber" BIGINT,
    "sourcePrimaryKey" TEXT,
    "sourceExtractTs" TIMESTAMP(3),
    "sourceRecordTs" TIMESTAMP(3),
    "opType" TEXT,
    "isDeletedFlag" BOOLEAN NOT NULL DEFAULT false,
    "schemaVersion" TEXT,
    "recordHash" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "parseStatus" TEXT NOT NULL DEFAULT 'parsed',
    "parseErrorCode" TEXT,
    "parseErrorDetail" TEXT,
    "partitionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alignmentRecordId" TEXT,
    "entityIdRaw" TEXT,
    "entityTypeRaw" TEXT,
    "territoryCodeRaw" TEXT,
    "territoryNameRaw" TEXT,
    "regionCodeRaw" TEXT,
    "regionNameRaw" TEXT,
    "districtCodeRaw" TEXT,
    "districtNameRaw" TEXT,
    "repIdRaw" TEXT,
    "repNameRaw" TEXT,
    "managerIdRaw" TEXT,
    "alignmentStartDate" TIMESTAMP(3),
    "alignmentEndDate" TIMESTAMP(3),
    "activeFlagRaw" BOOLEAN,
    "primaryFlagRaw" BOOLEAN,
    "sourceLastUpdatedTs" TIMESTAMP(3),

    CONSTRAINT "BronzeTerritoryAlignmentRaw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BronzeRepRosterRaw" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "brandId" TEXT,
    "datasetName" TEXT NOT NULL DEFAULT 'rep_roster',
    "sourceSystem" TEXT NOT NULL,
    "sourceFeedName" TEXT NOT NULL,
    "ingestionRunId" TEXT NOT NULL,
    "fileManifestId" TEXT,
    "sourceFileName" TEXT,
    "sourceFilePath" TEXT,
    "sourceRowNumber" BIGINT,
    "sourcePrimaryKey" TEXT,
    "sourceExtractTs" TIMESTAMP(3),
    "sourceRecordTs" TIMESTAMP(3),
    "opType" TEXT,
    "isDeletedFlag" BOOLEAN NOT NULL DEFAULT false,
    "schemaVersion" TEXT,
    "recordHash" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "parseStatus" TEXT NOT NULL DEFAULT 'parsed',
    "parseErrorCode" TEXT,
    "parseErrorDetail" TEXT,
    "partitionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repSourceId" TEXT,
    "employeeIdRaw" TEXT,
    "repNameRaw" TEXT,
    "repEmailRaw" TEXT,
    "roleRaw" TEXT,
    "teamRaw" TEXT,
    "territoryCodeRaw" TEXT,
    "territoryNameRaw" TEXT,
    "districtCodeRaw" TEXT,
    "regionCodeRaw" TEXT,
    "managerIdRaw" TEXT,
    "managerNameRaw" TEXT,
    "employmentStatusRaw" TEXT,
    "hireDateRaw" TIMESTAMP(3),
    "terminationDateRaw" TIMESTAMP(3),
    "sourceLastUpdatedTs" TIMESTAMP(3),

    CONSTRAINT "BronzeRepRosterRaw_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BronzeCtlIngestionRun_clientId_startedAt_idx" ON "BronzeCtlIngestionRun"("clientId", "startedAt");

-- CreateIndex
CREATE INDEX "BronzeCtlIngestionRun_brandId_idx" ON "BronzeCtlIngestionRun"("brandId");

-- CreateIndex
CREATE INDEX "BronzeCtlFileManifest_clientId_receivedTs_idx" ON "BronzeCtlFileManifest"("clientId", "receivedTs");

-- CreateIndex
CREATE INDEX "BronzeCtlFileManifest_ingestionRunId_idx" ON "BronzeCtlFileManifest"("ingestionRunId");

-- CreateIndex
CREATE INDEX "BronzeCtlRowRejection_clientId_ingestionRunId_idx" ON "BronzeCtlRowRejection"("clientId", "ingestionRunId");

-- CreateIndex
CREATE INDEX "BronzeCtlRowRejection_brandId_idx" ON "BronzeCtlRowRejection"("brandId");

-- CreateIndex
CREATE INDEX "BronzeCtlSchemaRegistry_clientId_sourceSystem_sourceFeedNam_idx" ON "BronzeCtlSchemaRegistry"("clientId", "sourceSystem", "sourceFeedName");

-- CreateIndex
CREATE INDEX "BronzeCtlSchemaRegistry_brandId_idx" ON "BronzeCtlSchemaRegistry"("brandId");

-- CreateIndex
CREATE INDEX "BronzeCtlMappingValidationIssue_clientId_ingestionRunId_idx" ON "BronzeCtlMappingValidationIssue"("clientId", "ingestionRunId");

-- CreateIndex
CREATE INDEX "BronzeCtlMappingValidationIssue_brandId_idx" ON "BronzeCtlMappingValidationIssue"("brandId");

-- CreateIndex
CREATE INDEX "BronzeCtlUnmappedFieldsRegistry_clientId_datasetName_idx" ON "BronzeCtlUnmappedFieldsRegistry"("clientId", "datasetName");

-- CreateIndex
CREATE INDEX "BronzeCtlUnmappedFieldsRegistry_brandId_idx" ON "BronzeCtlUnmappedFieldsRegistry"("brandId");

-- CreateIndex
CREATE INDEX "BronzeClaimsRaw_brandId_fillDate_idx" ON "BronzeClaimsRaw"("brandId", "fillDate");

-- CreateIndex
CREATE INDEX "BronzeClaimsRaw_brandId_ingestionRunId_idx" ON "BronzeClaimsRaw"("brandId", "ingestionRunId");

-- CreateIndex
CREATE INDEX "BronzeClaimsRaw_clientId_partitionDate_idx" ON "BronzeClaimsRaw"("clientId", "partitionDate");

-- CreateIndex
CREATE INDEX "BronzeSpCasesRaw_brandId_referralDate_idx" ON "BronzeSpCasesRaw"("brandId", "referralDate");

-- CreateIndex
CREATE INDEX "BronzeSpCasesRaw_brandId_ingestionRunId_idx" ON "BronzeSpCasesRaw"("brandId", "ingestionRunId");

-- CreateIndex
CREATE INDEX "BronzeSpCasesRaw_clientId_partitionDate_idx" ON "BronzeSpCasesRaw"("clientId", "partitionDate");

-- CreateIndex
CREATE INDEX "BronzeSpStatusHistoryRaw_brandId_ingestionRunId_idx" ON "BronzeSpStatusHistoryRaw"("brandId", "ingestionRunId");

-- CreateIndex
CREATE INDEX "BronzeSpStatusHistoryRaw_clientId_partitionDate_idx" ON "BronzeSpStatusHistoryRaw"("clientId", "partitionDate");

-- CreateIndex
CREATE INDEX "BronzeDispenseRaw_brandId_dispenseDate_idx" ON "BronzeDispenseRaw"("brandId", "dispenseDate");

-- CreateIndex
CREATE INDEX "BronzeDispenseRaw_brandId_ingestionRunId_idx" ON "BronzeDispenseRaw"("brandId", "ingestionRunId");

-- CreateIndex
CREATE INDEX "BronzeDispenseRaw_clientId_partitionDate_idx" ON "BronzeDispenseRaw"("clientId", "partitionDate");

-- CreateIndex
CREATE INDEX "BronzeShipmentsRaw_brandId_shipmentDate_idx" ON "BronzeShipmentsRaw"("brandId", "shipmentDate");

-- CreateIndex
CREATE INDEX "BronzeShipmentsRaw_brandId_ingestionRunId_idx" ON "BronzeShipmentsRaw"("brandId", "ingestionRunId");

-- CreateIndex
CREATE INDEX "BronzeShipmentsRaw_clientId_partitionDate_idx" ON "BronzeShipmentsRaw"("clientId", "partitionDate");

-- CreateIndex
CREATE INDEX "BronzeCallsRaw_brandId_callDate_idx" ON "BronzeCallsRaw"("brandId", "callDate");

-- CreateIndex
CREATE INDEX "BronzeCallsRaw_brandId_ingestionRunId_idx" ON "BronzeCallsRaw"("brandId", "ingestionRunId");

-- CreateIndex
CREATE INDEX "BronzeCallsRaw_clientId_partitionDate_idx" ON "BronzeCallsRaw"("clientId", "partitionDate");

-- CreateIndex
CREATE INDEX "BronzeHcpMasterRaw_brandId_ingestionRunId_idx" ON "BronzeHcpMasterRaw"("brandId", "ingestionRunId");

-- CreateIndex
CREATE INDEX "BronzeHcpMasterRaw_clientId_partitionDate_idx" ON "BronzeHcpMasterRaw"("clientId", "partitionDate");

-- CreateIndex
CREATE INDEX "BronzeHcoMasterRaw_brandId_ingestionRunId_idx" ON "BronzeHcoMasterRaw"("brandId", "ingestionRunId");

-- CreateIndex
CREATE INDEX "BronzeHcoMasterRaw_clientId_partitionDate_idx" ON "BronzeHcoMasterRaw"("clientId", "partitionDate");

-- CreateIndex
CREATE INDEX "BronzeAffiliationsRaw_brandId_ingestionRunId_idx" ON "BronzeAffiliationsRaw"("brandId", "ingestionRunId");

-- CreateIndex
CREATE INDEX "BronzeAffiliationsRaw_clientId_partitionDate_idx" ON "BronzeAffiliationsRaw"("clientId", "partitionDate");

-- CreateIndex
CREATE INDEX "BronzeTerritoryAlignmentRaw_brandId_ingestionRunId_idx" ON "BronzeTerritoryAlignmentRaw"("brandId", "ingestionRunId");

-- CreateIndex
CREATE INDEX "BronzeTerritoryAlignmentRaw_clientId_partitionDate_idx" ON "BronzeTerritoryAlignmentRaw"("clientId", "partitionDate");

-- CreateIndex
CREATE INDEX "BronzeRepRosterRaw_brandId_ingestionRunId_idx" ON "BronzeRepRosterRaw"("brandId", "ingestionRunId");

-- CreateIndex
CREATE INDEX "BronzeRepRosterRaw_clientId_partitionDate_idx" ON "BronzeRepRosterRaw"("clientId", "partitionDate");

-- AddForeignKey
ALTER TABLE "BronzeCtlIngestionRun" ADD CONSTRAINT "BronzeCtlIngestionRun_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BronzeCtlFileManifest" ADD CONSTRAINT "BronzeCtlFileManifest_ingestionRunId_fkey" FOREIGN KEY ("ingestionRunId") REFERENCES "BronzeCtlIngestionRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BronzeCtlFileManifest" ADD CONSTRAINT "BronzeCtlFileManifest_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BronzeCtlRowRejection" ADD CONSTRAINT "BronzeCtlRowRejection_ingestionRunId_fkey" FOREIGN KEY ("ingestionRunId") REFERENCES "BronzeCtlIngestionRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BronzeCtlRowRejection" ADD CONSTRAINT "BronzeCtlRowRejection_fileManifestId_fkey" FOREIGN KEY ("fileManifestId") REFERENCES "BronzeCtlFileManifest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BronzeCtlRowRejection" ADD CONSTRAINT "BronzeCtlRowRejection_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BronzeCtlSchemaRegistry" ADD CONSTRAINT "BronzeCtlSchemaRegistry_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BronzeCtlMappingValidationIssue" ADD CONSTRAINT "BronzeCtlMappingValidationIssue_ingestionRunId_fkey" FOREIGN KEY ("ingestionRunId") REFERENCES "BronzeCtlIngestionRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BronzeCtlMappingValidationIssue" ADD CONSTRAINT "BronzeCtlMappingValidationIssue_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BronzeCtlUnmappedFieldsRegistry" ADD CONSTRAINT "BronzeCtlUnmappedFieldsRegistry_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BronzeCtlUnmappedFieldsRegistry" ADD CONSTRAINT "BronzeCtlUnmappedFieldsRegistry_fileManifestId_fkey" FOREIGN KEY ("fileManifestId") REFERENCES "BronzeCtlFileManifest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BronzeClaimsRaw" ADD CONSTRAINT "BronzeClaimsRaw_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BronzeSpCasesRaw" ADD CONSTRAINT "BronzeSpCasesRaw_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BronzeSpStatusHistoryRaw" ADD CONSTRAINT "BronzeSpStatusHistoryRaw_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BronzeDispenseRaw" ADD CONSTRAINT "BronzeDispenseRaw_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BronzeShipmentsRaw" ADD CONSTRAINT "BronzeShipmentsRaw_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BronzeCallsRaw" ADD CONSTRAINT "BronzeCallsRaw_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BronzeHcpMasterRaw" ADD CONSTRAINT "BronzeHcpMasterRaw_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BronzeHcoMasterRaw" ADD CONSTRAINT "BronzeHcoMasterRaw_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BronzeAffiliationsRaw" ADD CONSTRAINT "BronzeAffiliationsRaw_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BronzeTerritoryAlignmentRaw" ADD CONSTRAINT "BronzeTerritoryAlignmentRaw_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BronzeRepRosterRaw" ADD CONSTRAINT "BronzeRepRosterRaw_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
