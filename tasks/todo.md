# Task Plan

> This file is the active task plan. Updated throughout every task.
> Format: check off items as completed. Add a Review section when done.

---

# Sprint 15 — Bronze Data Layer + Ingest API (2026-03-22)

## Status: COMPLETE

## Context
Build the full production-grade Bronze layer: 6 control/audit models + 11 raw business feed models (append-only, source-native, with rawPayload JSON + common metadata block on every row), plus `POST /api/ingest/facts` endpoint with ingestion run tracking, row rejection logging, and auto engine trigger.

## Tasks

### Pre-work
- [x] Write tasks/todo.md

### Agent 1 — Schema + migration
- [x] Add 6 BronzeCtl* models to `prisma/schema.prisma`
- [x] Add 11 Bronze*Raw models to `prisma/schema.prisma`
- [x] Add Brand relations for all 17 models
- [x] Run `npx prisma migrate dev --name add_bronze_layer`
- [x] Run `npx tsc --noEmit`

### Agent 2 — Ingest route (after Agent 1)
- [x] Write `lib/ingest-helpers.ts` (rowHash util)
- [x] Write `app/api/ingest/facts/route.ts` (RBAC + ingestion run + file manifest + per-table inserts + engine trigger)
- [x] Run `npx tsc --noEmit`

### Agent 3 — Tests + sprint15-check (after Agent 1, parallel with Agent 2)
- [x] Write `__tests__/ingest-helpers.test.ts` (rowHash determinism tests)
- [x] Write `scripts/sprint15-check.ts` (file existence + grep smoke checks)
- [x] Run `npx vitest run __tests__/ingest-helpers.test.ts`

### Agent 4 — Staff Engineer Review
- [x] RBAC correct (getOrgId + assertBrandAccess, no bare brand lookup)
- [x] IngestionRun created before rows, updated after
- [x] rowHash on every row, logger in catch block
- [x] Engine trigger matches engine/run/route.ts pattern

### Agent 5 — QA
- [x] `npx tsc --noEmit` — 0 errors ✅
- [x] `npx vitest run` — 70/70 ✅
- [x] `npx tsx scripts/qa-check.ts` — 114/114 ✅
- [x] `npx tsx scripts/regression-check.ts` — 16/16 ✅
- [x] `npx tsx scripts/sprint15-check.ts` — 30/30 ✅

### Completion
- [x] Create `notes/2026-03-22-sprint15-bronze-layer.md`
- [ ] Commit

---

# Sprint 14 — Logout Logger + Engine Threshold Centralization (2026-03-22)

## Status: COMPLETE

## Context
Two CLAUDE.md compliance gaps:
1. `app/api/auth/logout/route.ts` — missing lib/logger.ts (all API routes must log)
2. Engine thresholds scattered as magic numbers across 7 files — centralize into `lib/insight-engine/thresholds.ts`

## Tasks

### Pre-work
- [x] Write tasks/todo.md

### Agent 1 — Logout logger
- [x] Add `import { logger } from '@/lib/logger'` to `app/api/auth/logout/route.ts`
- [x] Add `logger.info('User logged out', { route: 'POST /api/auth/logout' })` before return
- [x] Run `npx tsc --noEmit`

### Agent 2 — Create thresholds.ts
- [x] Write `lib/insight-engine/thresholds.ts` with `THRESHOLDS` const object
- [x] Run `npx tsc --noEmit`

### Agent 3 — Wire THRESHOLDS into engine files (after Agent 2)
- [x] Update `lib/insight-engine/utils.ts` (15, 8 → THRESHOLDS)
- [x] Update all 6 templates to import + use THRESHOLDS
- [x] Run `npx tsc --noEmit`

### Agent 4 — Targeted tests (after Agent 2, parallel with Agent 3)
- [x] Write `__tests__/thresholds.test.ts` (config shape + ordering invariants)
- [x] Write `__tests__/engine-thresholds-integration.test.ts` (template boundary tests)
- [x] Write `scripts/sprint14-check.ts` (grep-based smoke checks)
- [x] Run `npx vitest run __tests__/thresholds.test.ts __tests__/engine-thresholds-integration.test.ts`

### Agent 5 — Staff Engineer Review
- [x] Verify logout logs, no inline literals remain, tests import THRESHOLDS not hardcoded values

### Agent 6 — QA
- [x] `npx tsc --noEmit` — 0 errors ✅
- [x] `npx vitest run` — 64/64 (20 new tests) ✅
- [x] `npx tsx scripts/qa-check.ts` — 114/114 ✅
- [x] `npx tsx scripts/regression-check.ts` — 16/16 ✅
- [x] `npx tsx scripts/sprint14-check.ts` — 15/15 ✅

### Completion
- [x] Create `notes/2026-03-22-sprint14-logout-thresholds.md`
- [ ] Commit

---

# Sprint 13 — Data Mapping Fixes (2026-03-22)

## Status: COMPLETE

## Context
Three gaps fixed:
1. Remove "Test on Sample" button (no backing feature)
2. Normalization Rules Edit buttons — add real inline edit modal + PATCH API
3. ID Crosswalk hardcoded data — build CrosswalkStat Prisma model, seed, fetch, render

## Tasks

### Pre-work
- [x] Write tasks/todo.md

### Agent 1 — Remove Test on Sample button
- [x] Remove `<Button>` element (lines 164–168) from `DataMappingClient.tsx`
- [x] Remove unused `Play` import if no longer used

### Agent 2 — Normalization Rules PATCH API
- [x] Add `PATCH /api/data-mapping/rules` handler to `app/api/data-mapping/rules/route.ts`
- [x] Validate id, normalizedValue, category, brandCode
- [x] RBAC: getOrgId + assertBrandAccess + verify brandId ownership
- [x] Use lib/logger.ts

### Agent 4 — CrosswalkStat schema + migration + seed
- [x] Add `CrosswalkStat` model to `prisma/schema.prisma`
- [x] Add `crosswalkStats CrosswalkStat[]` relation to `Brand` model
- [x] Run `npx prisma migrate dev --name add_crosswalk_stat`
- [x] Add idempotent seed data to `prisma/seed.ts` (delete + createMany)
- [x] Run `npx tsx prisma/seed.ts` — verify seeds

### Agent 3 — Normalization Rules edit modal (client)
- [x] Add editingRule, editNormalizedValue, editCategory state
- [x] Add openEditRule + saveEditRule functions (fetch PATCH /api/data-mapping/rules)
- [x] Wire Edit buttons, add accessible modal (role/aria-modal/aria-labelledby)
- [x] Update local normalizationRules state on save

### Agent 5 — CrosswalkStat server fetch + client render
- [x] Add crosswalkStats to Promise.all in `data-mapping/page.tsx`
- [x] Pass as prop to DataMappingClient
- [x] Replace hardcoded crosswalk arrays with dynamic DB data
- [x] Dynamic accordion count from stats

### Verification
- [x] `npx tsc --noEmit` — 0 errors ✅
- [x] `npx vitest run` — 44/44 ✅
- [x] `npx tsx scripts/qa-check.ts` — 114/114 ✅
- [x] `npx tsx scripts/regression-check.ts` — 16/16 ✅

### Completion
- [x] Create `notes/2026-03-22-sprint13-data-mapping-fixes.md`
- [ ] Commit

---

# Sprint 9 — UX Completeness

## Status: IN PROGRESS

## Tasks

### Pre-work
- [x] Write tasks/todo.md

### Agent A — Quick Wins
- [x] Fix HomeClient console.error → logger.error
- [x] Wire Share button (copy link to clipboard + toast) on Insight Detail
- [x] Verify / wire Save Notes button on Insight Detail
- [x] Add error toasts (sonner) to Home, Insights list, Insight Detail, Data Mapping catch blocks
- [x] Fix dynamic "Last data drop" timestamp in Sidebar (remove hardcoded date)

### Agent B — Export Selected
- [x] Add `selectedIds: Set<string>` state to InsightsClient
- [x] Wire checkbox `checked` + `onCheckedChange` on each insight row
- [x] Add select-all checkbox in table header
- [x] Disable Export button when no selection; show count badge when selected
- [x] Create `lib/export-csv.ts` with `exportInsightsToCsv(insights)` helper
- [x] Wire Export button to download CSV

### Agent C — Notification Bell
- [x] Create `components/layout/NotificationPanel.tsx` (Popover with two sections)
- [x] Lazy-fetch high-severity insights + due actions on popover open
- [x] Show loading skeleton + empty state
- [x] Dynamic red dot: only shown when critical insights or overdue actions exist
- [x] Wire bell button in TopBar.tsx to NotificationPanel

### Verification
- [x] npx tsc --noEmit — zero errors
- [x] npx vitest run — 352 tests pass
- [x] npx tsx scripts/qa-check.ts — 114/114
- [x] npx tsx scripts/regression-check.ts — 16/16 passes

### Completion
- [x] Create notes/2026-03-19-sprint9-ux-completeness.md
- [x] Commit + push + create PR

---

# Sprint 12 — Home & Insights Filter Fixes (2026-03-22)

## Status: IN PROGRESS

## Context
Full codebase audit revealed 3 filter UX gaps:
1. FilterContext initializes from hardcoded defaults, not URL — TopBar resets on page refresh
2. Non-Nation geographies return blank page (no DataRun for those geographies in seed)
3. Insights pillar filter is client-side — with pagination, only filters current 10-row page

## Tasks

### Pre-work
- [x] Write tasks/todo.md

### Agent 1 — FilterContext URL initialization
- [x] Fix `components/FilterContext.tsx` to initialize brand/timeWindow/geography from `useSearchParams()`
- [x] Wrap with `<Suspense>` boundary per Next.js 15 requirement

### Agent 2 — Home page geography fallback
- [x] Fix `app/(app)/home/page.tsx` to fall back to Nation DataRun when selected geography has no data
- [x] Pass `geographyFallback: boolean` + `selectedGeography: string` props to `HomeClient`
- [x] Fix `app/(app)/home/HomeClient.tsx` to show info banner when `geographyFallback=true`

### Agent 3 — Insights page: geography fallback + pillar server-side
- [x] Fix `app/(app)/insights/page.tsx` for same geography fallback
- [x] Add `pillar` to URL searchParams read + Prisma `where` clause in `insights/page.tsx`
- [x] Fix `app/(app)/insights/InsightsClient.tsx` pillar dropdown to use `router.push()` (URL-driven)

### Staff Engineer Review → Fix Round
- [x] Fix `geographyFallback` computed after fallback query in `home/page.tsx` and `insights/page.tsx`
- [x] Add `VALID_PILLARS` allowlist in `insights/page.tsx`
- [x] Fix `useEffect` early-return guard in `InsightsClient.tsx`; replace `window.location.search` with `searchParams.toString()`

### Agent 6 — QA + Verification
- [x] `npx tsc --noEmit` — 0 errors ✅
- [x] `npx vitest run` — 44/44 tests pass ✅
- [x] `npx tsx scripts/qa-check.ts` — 114/114 ✅
- [x] `npx tsx scripts/regression-check.ts` — 16/16 ✅

### Completion
- [x] Create `notes/2026-03-22-sprint12-filter-fixes.md`
- [ ] Commit with descriptive message

## Status: COMPLETE

---

## Post-Sprint 9 — Middleware Edge Runtime Fix (2026-03-21)

### Status: COMPLETE

- [x] Diagnose login redirect loop (middleware Prisma → Edge Runtime incompatibility)
- [x] Create app/api/auth/verify-session/route.ts (internal tokenVersion check)
- [x] Update middleware.ts to use fetch instead of Prisma
- [x] Add INTERNAL_SECRET to .env.local
- [x] Accessibility: add role/aria-modal/aria-labelledby to modals in ActionsClient, DataMappingClient, UploadMappingWizard, InsightDetailClient
- [x] Write notes/2026-03-21-middleware-edge-runtime-fix.md
- [x] npx tsc --noEmit → clean
