-- CreateIndex
CREATE INDEX "CallsMetricsFact_brandId_weekEnding_idx" ON "CallsMetricsFact"("brandId", "weekEnding");

-- CreateIndex
CREATE INDEX "ClaimsMetricsFact_brandId_weekEnding_idx" ON "ClaimsMetricsFact"("brandId", "weekEnding");

-- CreateIndex
CREATE INDEX "ClaimsMetricsFact_brandId_dimensionType_idx" ON "ClaimsMetricsFact"("brandId", "dimensionType");

-- CreateIndex
CREATE INDEX "Contributor_insightId_idx" ON "Contributor"("insightId");

-- CreateIndex
CREATE INDEX "DataRun_brandId_runAt_idx" ON "DataRun"("brandId", "runAt");

-- CreateIndex
CREATE INDEX "Driver_insightId_idx" ON "Driver"("insightId");

-- CreateIndex
CREATE INDEX "GoldInputSnapshot_brandId_dataRunId_idx" ON "GoldInputSnapshot"("brandId", "dataRunId");

-- CreateIndex
CREATE INDEX "GoldInputSnapshot_brandId_metric_dimension_idx" ON "GoldInputSnapshot"("brandId", "metric", "dimension");

-- CreateIndex
CREATE INDEX "Insight_dataRunId_severity_idx" ON "Insight"("dataRunId", "severity");

-- CreateIndex
CREATE INDEX "Insight_brandId_dataRunId_idx" ON "Insight"("brandId", "dataRunId");

-- CreateIndex
CREATE INDEX "InsightRisk_insightId_idx" ON "InsightRisk"("insightId");

-- CreateIndex
CREATE INDEX "MetricChange_insightId_idx" ON "MetricChange"("insightId");

-- CreateIndex
CREATE INDEX "SpMetricsFact_brandId_recordDate_idx" ON "SpMetricsFact"("brandId", "recordDate");

-- CreateIndex
CREATE INDEX "TerritoryChangeLog_brandId_changeDate_idx" ON "TerritoryChangeLog"("brandId", "changeDate");
