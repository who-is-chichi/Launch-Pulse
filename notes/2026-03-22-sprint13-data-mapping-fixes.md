# Sprint 13 — Data Mapping Fixes

**Date:** 2026-03-22
**Status:** Complete

---

## What Changed

### 1. Removed "Test on Sample" button — `DataMappingClient.tsx`
- Removed `<Button>` element (was lines 164–168) that had no backing feature
- Removed `Play` import from lucide-react (no longer used)
- **Before:** Dead button in the header that did nothing when clicked
- **After:** Header is clean; no misleading UI elements

### 2. Normalization Rules Edit modal + PATCH API

#### `app/api/data-mapping/rules/route.ts`
- Added `PATCH /api/data-mapping/rules` handler
- Validates `id`, `normalizedValue`, `category`, `brandCode`
- RBAC: `getOrgId` + `assertBrandAccess` + `rule.brandId === brand.id` ownership check
- Uses `lib/logger.ts` for structured error logging
- Returns `{ ok: true, rule }`

#### `app/(app)/data-mapping/DataMappingClient.tsx`
- Added `editingRule`, `editNormalizedValue`, `editCategory` state
- Added `openEditRule(rule)` + `saveEditRule()` functions
- Edit buttons now call `openEditRule(rule)` — previously dead
- Accessible edit modal: `role="dialog" aria-modal="true" aria-labelledby="edit-rule-title"`
- Modal fields: text input for `normalizedValue` (read-only `hubValue` label), select for `category` (Investigation / Access / Engagement / Fulfillment / Closed)
- Updates local `normalizationRules` state on save (no full page reload)

### 3. CrosswalkStat model + dynamic ID Crosswalk rendering

#### `prisma/schema.prisma`
- Added `CrosswalkStat` model: `id`, `brandId`, `statType`, `label`, `matchRate`, `unmatchedCount`, `entityType`, `updatedAt`, `@@index([brandId])`
- Added `crosswalkStats CrosswalkStat[]` relation to `Brand` model
- Migration: `add_crosswalk_stat`

#### `prisma/seed.ts`
- Idempotent: `crosswalkStat.deleteMany` before `createMany`
- 3 rows seeded per brand:
  - `npi_coverage`: NPI Coverage, 94.2%, 23 unmatched HCPs
  - `account_id_match`: Account ID Match Rate, 97.8%, 14 unmatched Accounts
  - `territory_alignment`: Territory Alignment, 100%, 0 unmatched

#### `app/(app)/data-mapping/page.tsx`
- Added `crosswalkStat.findMany` to `Promise.all`
- Serialized and passed as `crosswalkStats` prop to `DataMappingClient`

#### `app/(app)/data-mapping/DataMappingClient.tsx`
- Replaced hardcoded crosswalk array with `crosswalkStats.map(...)` — color logic: `>= 95 → green, >= 85 → amber, < 85 → red`
- Dynamic accordion trigger: builds `"View Unmatched Records (23 HCPs, 14 Accounts)"` from live DB data
- Real unmatched records table in accordion body

---

## Why

Full codebase audit (Sprint 12 planning) identified 3 Data Mapping page gaps:
1. "Test on Sample" button had no backing feature — no raw data ingestion pipeline yet
2. Normalization Rules Edit buttons were wired to nothing
3. ID Crosswalk stats were hardcoded — no DB model; data could never update

---

## Key Decisions

- **Remove button vs stub**: Removed entirely rather than showing a disabled stub — the feature doesn't exist yet and the button was misleading
- **Edit modal (not inline)**: Matches existing mapping config edit pattern; simpler than in-row editing for a demo-scale app
- **CrosswalkStat as separate model**: Brand-scoped, clean extension of existing schema pattern; easy to populate via future data pipeline
- **Color thresholds**: ≥95% green, ≥85% amber, <85% red — standard match-rate conventions
- **Staff Engineer review caught**: `normalizedValue`/`category` have no max-length bound in PATCH route (low severity, no exec context); `territory_alignment` entityType is empty string (works correctly since unmatchedCount is 0)

---

## Verification

- `npx tsc --noEmit` — clean ✅
- `npx vitest run` — 44/44 ✅
- `npx tsx scripts/qa-check.ts` — 114/114 ✅
- `npx tsx scripts/regression-check.ts` — 16/16 ✅

---

## Files Changed

- `app/(app)/data-mapping/DataMappingClient.tsx`
- `app/api/data-mapping/rules/route.ts`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `app/(app)/data-mapping/page.tsx`
