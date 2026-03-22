# Sprint 14 — Logout Logger + Engine Threshold Centralization

**Date:** 2026-03-22
**Status:** Complete

---

## What Changed

### 1. Logout route logger — `app/api/auth/logout/route.ts`
- Added `import { logger } from '@/lib/logger'`
- Added `logger.info('User logged out', { route: 'POST /api/auth/logout' })`
- **Before:** Route silently deleted the session cookie with no audit trail
- **After:** Every logout event is logged with structured JSON (route, timestamp)

### 2. Engine threshold centralization

#### `lib/insight-engine/thresholds.ts` (NEW)
Single source of truth for all alert-firing and severity thresholds. `as const` object with 25 named keys across 7 template domains. Includes `Thresholds` type export. Change thresholds here — no template edits needed.

#### `lib/insight-engine/utils.ts`
- `deriveSeverity()` now references `THRESHOLDS.severityHighChangePct` (15) and `THRESHOLDS.severityMedChangePct` (8)

#### All 6 template files updated:
| Template | Thresholds replaced |
|----------|-------------------|
| `demand-adoption-inflection` | `demandMinChangePct`, `demandHighImpact`, `demandMedImpact` |
| `demand-top-systems-swing` | `demandTopN`, `demandSwingMinDelta`, `demandSwingHighImpact`, `demandSwingMedImpact` |
| `startops-ttt-shift` | `tttMinDayChange`, `tttHighImpact`, `tttMedImpact` |
| `execution-coverage-shift` | `coverageMinDropPct`, `coverageComplianceBaseline`, `coverageHighImpact`, `coverageMedImpact` |
| `startops-sp-bottleneck` | `spBacklogPct`, `spResolutionDayChange`, `spHighImpact`, `spMedImpact` |
| `structure-territory-churn` | `territoryHighReps`, `territoryMedReps` |
| `structure-formulary-change` | `formularyHighImpact`, `formularyMedImpact`, `formularyLivesUnit` (×2) |

### 3. New targeted tests

#### `__tests__/thresholds.test.ts` (7 tests)
- All 25 THRESHOLDS keys exist and are positive numbers
- Ordering invariants: high > medium for all high/med pairs
- `spBacklogPct` is a fraction (0 < x < 1)

#### `__tests__/engine-thresholds-integration.test.ts` (13 tests)
- Each of 6 templates: one test that fires AT the threshold boundary, one that does NOT fire below it
- Tests use `THRESHOLDS.*` values directly — stay green even if thresholds are tuned
- `structureTerritoryChurn` also covers Medium vs High severity tier split

#### `scripts/sprint14-check.ts`
- 15 grep-based smoke checks: logout logger, thresholds.ts existence + export, all 8 engine files import THRESHOLDS, no replaced raw literals remain

---

## Why

- CLAUDE.md rule: all API routes must use `lib/logger.ts` — logout was the only route missing it
- Engine had 25+ magic numbers scattered across 7 files — impossible to tune without risky multi-file edits; no tests catching accidental inversions

---

## Key Decisions

- **`as const` over interface**: Prevents accidental runtime mutation; gives literal types for each value
- **Named constants over positional args**: `deriveSeverity(..., THRESHOLDS.spHighImpact, THRESHOLDS.spMedImpact)` is self-documenting; the previous `deriveSeverity(..., 100, 50)` required template-specific knowledge
- **Integration tests reference THRESHOLDS not hardcoded numbers**: If a threshold is changed from 15% to 12%, the boundary tests automatically track the new value — no test maintenance needed
- **Staff engineer caught**: `structure-formulary-change.ts` had a second `/1000` literal on line 54 (`lossLivesK`) that was also replaced

---

## Verification

- `npx tsc --noEmit` — clean ✅
- `npx vitest run` — 64/64 (up from 44; 20 new tests) ✅
- `npx tsx scripts/qa-check.ts` — 114/114 ✅
- `npx tsx scripts/regression-check.ts` — 16/16 ✅
- `npx tsx scripts/sprint14-check.ts` — 15/15 ✅

---

## Files Changed

- `app/api/auth/logout/route.ts`
- `lib/insight-engine/thresholds.ts` (NEW)
- `lib/insight-engine/utils.ts`
- `lib/insight-engine/templates/demand-adoption-inflection.ts`
- `lib/insight-engine/templates/demand-top-systems-swing.ts`
- `lib/insight-engine/templates/startops-ttt-shift.ts`
- `lib/insight-engine/templates/execution-coverage-shift.ts`
- `lib/insight-engine/templates/startops-sp-bottleneck.ts`
- `lib/insight-engine/templates/structure-territory-churn.ts`
- `lib/insight-engine/templates/structure-formulary-change.ts`
- `__tests__/thresholds.test.ts` (NEW)
- `__tests__/engine-thresholds-integration.test.ts` (NEW)
- `scripts/sprint14-check.ts` (NEW)
