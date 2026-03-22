# Sprint 15 — Bronze Data Layer + Ingest API

**Date:** 2026-03-22
**Status:** Complete

---

## What Changed

### 1. Bronze layer — 17 new Prisma models

Migration: `add_bronze_layer`

**Control / audit tables (6) — `BronzeCtl*`:**
- `BronzeCtlIngestionRun` — one row per pipeline execution (status, row counts, trigger type)
- `BronzeCtlFileManifest` — one row per incoming file/object (checksum, row counts, archive flag)
- `BronzeCtlRowRejection` — rows that failed insert (stage, code, reason, rawPayload)
- `BronzeCtlSchemaRegistry` — source schema versions (column definitions JSON, activeFlag)
- `BronzeCtlMappingValidationIssue` — file-to-canonical mapping problems (issueLevel, issueType)
- `BronzeCtlUnmappedFieldsRegistry` — source columns preserved but not yet mapped

**Raw business tables (11) — `Bronze*Raw`:**
- `BronzeClaimsRaw` — raw claims rows (claim/fill/service dates, NPI, NDC, payer, plan, amounts)
- `BronzeSpCasesRaw` — raw SP/hub case records (full lifecycle dates, referral through closure)
- `BronzeSpStatusHistoryRaw` — raw status transitions (event sequence, effective/end timestamps)
- `BronzeDispenseRaw` — raw dispense/fill events (quantity, days supply, pharmacy)
- `BronzeShipmentsRaw` — raw shipment records (tracking, carrier, delivery date)
- `BronzeCallsRaw` — raw CRM interactions (rep, territory, call type, duration, plan flag)
- `BronzeHcpMasterRaw` — raw HCP master records (NPI, name, specialty, address)
- `BronzeHcoMasterRaw` — raw HCO/account master records (account type, IDN flag, address)
- `BronzeAffiliationsRaw` — raw L1/L2/L3 affiliation relationships (entity type, ownership pct)
- `BronzeTerritoryAlignmentRaw` — raw territory alignment (entity → territory → region → district)
- `BronzeRepRosterRaw` — raw rep roster (employee ID, territory, manager hierarchy, status)

**Common metadata block on every raw table (25 fields):**
`clientId`, `brandId`, `datasetName`, `sourceSystem`, `sourceFeedName`, `ingestionRunId`, `fileManifestId`, `sourceFileName`, `sourceFilePath`, `sourceRowNumber`, `sourcePrimaryKey`, `sourceExtractTs`, `sourceRecordTs`, `opType`, `isDeletedFlag`, `schemaVersion`, `recordHash`, `rawPayload`, `parseStatus`, `parseErrorCode`, `parseErrorDetail`, `partitionDate`, `loadedAt`, `createdAt`

### 2. `lib/ingest-helpers.ts` (NEW)
Single `computeRowHash(row: unknown): string` — SHA-256 hash of `JSON.stringify(row)`. Used to stamp every Bronze row for deduplication and change tracking.

### 3. `app/api/ingest/facts/route.ts` (NEW)

`POST /api/ingest/facts` — accepts raw payloads for any of the 11 Bronze tables in one call, tracks everything, and auto-triggers the engine.

**Request**: `{ brandCode, sourceSystem, sourceFeedName, fileName?, filePath?, fileDate?, fileType?, claims?, spCases?, spStatusHistory?, dispense?, shipments?, calls?, hcpMaster?, hcoMaster?, affiliations?, territoryAlignment?, repRoster? }`

**Flow**:
1. Validate required fields + at least one array non-empty
2. RBAC: `getOrgId` + `assertBrandAccess`
3. Create `BronzeCtlIngestionRun` (status: running)
4. Create `BronzeCtlFileManifest`
5. For each dataset array: compute `recordHash` per row → `prisma.bronze*Raw.create` → on failure: `BronzeCtlRowRejection`
6. Update `BronzeCtlIngestionRun` + `BronzeCtlFileManifest` with final counts/status
7. Create `DataRun` → `runInsightEngine` → `evaluateActions` (same pattern as `engine/run/route.ts`)
8. Return `{ ok, ingestionRunId, dataRunId, accepted, rejected, insightsCreated, actionsEvaluated }`
9. Catch: `logger.error` + mark IngestionRun as 'failed'

### 4. New tests

#### `__tests__/ingest-helpers.test.ts` (6 tests)
Pure unit tests: hex format, determinism, collision resistance, null values, empty object.

#### `scripts/sprint15-check.ts` (30 checks)
Grep-based smoke: file existence, RBAC imports, engine trigger, all 11 raw table writes, schema models, helper exports.

---

## Why

- Platform had no Bronze layer — Gold fact tables were populated only by `prisma/seed.ts`
- No way for external systems (CRM, SP hub, claims vendor) to push raw data
- No ingestion audit trail, no row rejection tracking, no file lineage

---

## Key Decisions

- **Append-only**: Bronze rows are never updated or deleted — full replayability
- **Hybrid model**: typed extracted columns + `rawPayload Json` blob on every row — downstream Silver/Gold can read typed fields; full source row preserved for replay
- **`clientId` on every model**: supports future multi-tenant separation at query level
- **`recordHash` per row**: SHA-256 of the raw payload — enables deduplication and change detection in Silver
- **IngestionRun before rows**: control record exists before any row data, so if mid-batch failure occurs, the run is marked 'failed' (not orphaned)
- **Row rejection, not request rejection**: invalid rows write to `BronzeCtlRowRejection`; valid rows still ingest — consistent with Bronze "store everything" principle
- **Staff engineer caught**: `sprint15-check.ts` only checked 3 of 11 raw tables — fixed to loop all 11

---

## Verification

- `npx tsc --noEmit` — clean ✅
- `npx vitest run` — 70/70 (up from 64; 6 new ingest-helpers tests) ✅
- `npx tsx scripts/qa-check.ts` — 114/114 ✅
- `npx tsx scripts/regression-check.ts` — 16/16 ✅
- `npx tsx scripts/sprint15-check.ts` — 30/30 ✅

---

## Files Changed

- `prisma/schema.prisma` — 17 new models + Brand relations
- `prisma/migrations/20260322225942_add_bronze_layer/` — new migration
- `app/api/ingest/facts/route.ts` (NEW)
- `lib/ingest-helpers.ts` (NEW)
- `__tests__/ingest-helpers.test.ts` (NEW)
- `scripts/sprint15-check.ts` (NEW)
