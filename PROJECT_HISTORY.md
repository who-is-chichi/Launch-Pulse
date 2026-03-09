# Commercial Insights Platform — Full Project History

Generated: 2026-03-09

---

## What This Project Is

**Launch Pulse** — a Next.js 15 commercial insights platform for pharmaceutical brand launches (demo brand: ONC-101). It pulls data from a PostgreSQL database via Prisma ORM and shows KPI tiles, AI-generated insights, action tracking, and impact evaluation across a Kanban board.

**Stack:** Next.js 15 App Router · TypeScript · Prisma · PostgreSQL · Vitest · Tailwind CSS · Framer Motion

---

## Sprint-by-Sprint Summary

---

### Sprint 1 — Foundation (complete)

Built the core scaffold:
- Next.js 15 App Router with `(app)` route group + layout (Sidebar, TopBar, FilterContext)
- Prisma schema with all core models: `Brand`, `DataRun`, `Insight`, `Driver`, `MetricChange`, `Contributor`, `InsightRisk`, `Action`, `ImpactScore`, `KpiTile`, `Dataset`, `GoldInputSnapshot`, fact tables (`ClaimsMetricsFact`, `SpMetricsFact`, `CallsMetricsFact`, `StructureChangeLog`)
- Login page + cookie-based session auth (`app/api/auth/login/route.ts`, middleware.ts)
- Home page with KPI tiles, top insights, actions, data freshness panel
- Insights list page with filtering
- Actions Kanban board (drag-and-drop via react-dnd)
- Insight detail page (server component + `InsightDetailClient`)
- Basic seed data (`prisma/seed.ts`)
- `npm run demo:reset` script

---

### Sprint 2 — Insight Engine (complete)

Built the automated insight generation engine:

**Engine (`lib/insight-engine/index.ts`):**
- 6 insight templates: Demand Drop, SP Conversion, Execution Gap, Structure Change, Time-to-Therapy, Demand Momentum
- Reads from fact tables, derives severity/confidence, writes `Insight` + `Driver` + `MetricChange` + `Contributor` + `InsightRisk` + `GoldInputSnapshot` rows
- **Idempotent** — reruns on the same DataRun delete and regenerate (no duplicates)
- Pure utility functions in `lib/insight-engine/utils.ts`: `deriveConfidence`, `deriveSeverity`, `formatPct`, `formatNum`, `makeSparkline`, `filterByWeek`, `findByDate`

**API:** `POST /api/runs/[id]/generate-insights` — triggers engine on a specific DataRun

**Regression check script** (`scripts/regression-check.ts`):
- Verifies idempotency (rerun = same count)
- Validates severity/confidence values
- Confirms GoldInputSnapshot populated
- Tests graceful handling of missing data (no crash)

**Seed updated** (`prisma/seed.ts`):
- Removed 14 hardcoded insights (now engine-generated)
- Engine called on all 5 DataRuns during seed
- Expanded fact tables to 4 weeks of calls/claims data

**QA check** (`scripts/qa-check.ts`): structural assertions against the DB.

---

### Sprint 3 — AI Narrative + Exec Pack Export (complete)

**AI features:**
- `POST /api/ai/insight-narrative` — generates per-insight narrative using Claude API
- `POST /api/ai/summary` — generates executive summary for export
- `AIInsightNarrative` component in InsightDetailClient (streaming-style display with Brain icon + pulse animation)

**Exec Pack export** (`app/api/export/route.ts`):
- `GET /api/export?brand=ONC-101` — generates branded HTML exec pack
- Includes KPI tiles, top insights, actions, impact scorecards
- Download as `.html` file from Home page "Download Exec Pack" button

**QA:** 113/113 assertions passing after Sprint 3.

---

### Sprint 4 — RBAC Hooks + Impact Evaluator + Actions Extensions (complete)

**Schema additions** (migration: `add_rbac_hooks_impactscore_auto_action_fields`):
- `Brand.orgId String?` — future multi-tenant isolation key
- `Insight.createdBy String?` — audit trail placeholder
- `Action.ownerRole String?`, `Action.notes String?`, `Action.createdBy String?`
- `ImpactScore.baselineDataRunId`, `.evaluatedDataRunId`, `.metricKey`, `.baselineValue`, `.currentValue`, `.autoEvaluated Boolean @default(false)`

**Impact Evaluator** (`lib/impact-evaluator.ts`):
- `evaluateActions(newRunId)` — auto-scores "done" actions against metric data
- Pure functions exported for testing: `lagToDays(expectedLag)`, `computeVerdict(baseline, current, metricKey)`
- Hooked into engine run (`app/api/engine/run/route.ts`) — runs automatically after each insight generation
- Response includes `actionsEvaluated: N`

**Action API extensions:**
- `POST /api/actions` — now accepts `ownerRole`, `notes`
- `PATCH /api/actions/[id]` — now accepts `ownerRole`, `notes`

**UI updates:**
- `InsightDetailClient` — added `ownerRole` field, `notes` textarea, `expectedLag` dropdown (Immediate / 1-2 weeks / 2-3 weeks) in "Create Action" modal
- `ActionsClient` — interfaces updated for `ownerRole`/`notes`; "Auto" badge on auto-evaluated impact scorecards

**Logger** (`lib/logger.ts`):
- Structured JSON logger with `info`/`warn`/`error` levels
- Replaced `console.error` in 5 API routes: `actions/route.ts`, `actions/[id]/route.ts`, `engine/run/route.ts`, `insights/[id]/route.ts`, `runs/[id]/generate-insights/route.ts`

**CI** (`.github/workflows/ci.yml`):
- Runs on push to `main`/`develop` and PRs to `main`
- Steps: `npm ci` → `prisma generate` → `lint` → `build` → `test`

**Vitest setup:**
- `vitest.config.ts` with `@` alias
- `lib/actions-validation.ts` — extracted validation logic for testability
- `__tests__/impact-evaluator.test.ts` — 14 tests for `lagToDays`, `computeVerdict`
- `__tests__/actions-validation.test.ts` — 11 tests for `validateActionBody`, `validateImpactScoreBody`
- **25 unit tests passing**

---

### Sprint 5 — QA, Stabilization, Release Readiness (complete)

**Step 1 — Logger fix:**
- `app/api/ai/summary/route.ts` — replaced `console.error` with `logger.error` (last remaining console.error in API routes)

**Step 2 — Insight Notes persistence:**
- Schema: added `notes String?` to `Insight` model (migration: `add_insight_notes`)
- `PATCH /api/insights/[id]` — now accepts optional `notes` field alongside `status`
- `InsightDetailClient.tsx` — notes textarea wired to save on blur + "Save Notes" button with "Saved" confirmation

**Step 3 — "Create Action Manually" modal in ActionsClient:**
- Full modal with fields: Title, Linked Insight, Owner, Owner Role (optional), Due Date, Severity, Expected Lag, Notes (optional)
- POSTs to `POST /api/actions` on submit
- Prepends new action to Kanban on success

**Step 4 — Engine utility tests:**
- `__tests__/insight-engine.test.ts` — 19 tests for `deriveConfidence`, `deriveSeverity`, `formatPct`, `formatNum`, `makeSparkline`
- **Total: 44 unit tests passing**

**Step 5 — QA check extended:**
- `scripts/qa-check.ts` — added `[GoldInputSnapshot]` section
- **114/114 QA assertions passing**

**Step 6 — ESLint config:**
- `.eslintrc.json` created (`{"extends":"next/core-web-vitals"}`) to allow non-interactive CI lint

**Verification status at Sprint 5 end:**
- ✅ `npm run test` → 44 passing
- ✅ `npx tsx scripts/qa-check.ts` → 114/114
- ✅ `npx tsx scripts/regression-check.ts` → PASSED
- ✅ `npx tsc --noEmit` → clean (no TypeScript errors)
- ⚠️ `npm run build` → blocked by EPERM (dev server holding `.next/trace`)

---

### Post-Sprint 5 — Dev Server Fix

**Issue:** "Internal Server Error on localhost:3000" after Sprint 5 completion.

**Root cause:** Next.js dev server had stale module state after the Prisma migration. The `POST /api/auth/login` route was returning 500 (this route was NOT modified in Sprint 5 — it's a dev server hot-reload issue).

**Fix:** Restart the dev server (`Ctrl+C` then `npm run dev`). If persists: `rm -rf .next && npm run dev`.

---

## Current File Structure (key files)

```
app/
  (app)/
    home/           page.tsx + HomeClient.tsx
    insights/       page.tsx + [id]/page.tsx + [id]/InsightDetailClient.tsx
    actions/        page.tsx + ActionsClient.tsx
    data-mapping/   page.tsx
    settings/       page.tsx
    layout.tsx
  api/
    auth/login/     route.ts
    auth/logout/    route.ts
    ai/
      insight-narrative/  route.ts
      summary/            route.ts
    insights/[id]/  route.ts  (GET + PATCH — status + notes)
    actions/        route.ts  (GET + POST)
    actions/[id]/   route.ts  (PATCH + DELETE)
    engine/run/     route.ts  (POST — triggers insight engine + evaluateActions)
    runs/[id]/generate-insights/  route.ts
    export/         route.ts  (GET — HTML exec pack)
  login/            page.tsx
  page.tsx          (redirects to /home)
  layout.tsx

lib/
  prisma.ts                   Prisma client singleton
  logger.ts                   Structured JSON logger
  insight-engine/
    index.ts                  Main engine (runInsightEngine)
    utils.ts                  Pure functions (deriveConfidence, deriveSeverity, etc.)
  impact-evaluator.ts         evaluateActions, lagToDays, computeVerdict
  actions-validation.ts       validateActionBody, validateImpactScoreBody

prisma/
  schema.prisma               Full DB schema
  seed.ts                     Demo data seeder (npm run demo:reset)
  migrations/                 All applied migrations

scripts/
  qa-check.ts                 114-assertion structural QA
  regression-check.ts         Idempotency + missing-data regression tests
  demo-script.md              Sales demo walkthrough script
  test-db.mjs                 Quick DB health check (created during debugging)
  check-route.mjs             Dev debugging file (can be deleted)

__tests__/
  impact-evaluator.test.ts    14 tests
  actions-validation.test.ts  11 tests
  insight-engine.test.ts      19 tests

.github/workflows/ci.yml      CI pipeline
vitest.config.ts              Vitest config with @ alias
.eslintrc.json                ESLint config for CI
middleware.ts                 Auth middleware (cookie session guard)
```

---

## Database Schema (key models)

| Model | Purpose |
|-------|---------|
| `Brand` | Brand record (ONC-101) |
| `DataRun` | Each engine run / time window |
| `Insight` | Engine-generated insight (notes, status fields) |
| `Driver` | Why the insight occurred |
| `MetricChange` | Before/after metric values |
| `Contributor` | Geographic/entity breakdown |
| `InsightRisk` | Confidence flags |
| `Action` | Kanban action items |
| `ImpactScore` | Outcome measurement for done actions |
| `KpiTile` | Dashboard KPI tiles (4 per run) |
| `Dataset` | Data freshness panel |
| `GoldInputSnapshot` | Raw evidence snapshot per engine run |
| `ClaimsMetricsFact` | Weekly Rx claim data |
| `SpMetricsFact` | SP case / TTT data |
| `CallsMetricsFact` | Field rep call compliance data |
| `StructureChangeLog` | Territory/formulary structure changes |

---

## Key Commands

```bash
npm run dev                          # Start dev server (port 3000)
npm run demo:reset                   # Wipe + reseed database
npm run test                         # Run 44 vitest unit tests
npx tsx scripts/qa-check.ts          # Run 114 structural QA assertions
npx tsx scripts/regression-check.ts  # Run idempotency regression check
npx tsc --noEmit                     # TypeScript type check
npm run build                        # Production build
npm run lint                         # ESLint
```

---

## MVP Exit Criteria Status

| Criterion | Status |
|-----------|--------|
| Gold DB + API fully powers UI | ✅ |
| Insight generator per run | ✅ |
| AI narrative + exportable exec pack | ✅ |
| Action + impact loop across runs | ✅ |
| Schema RBAC-ready (orgId, createdBy hooks) | ✅ |
| Notes on insights persist | ✅ |
| "Create Action Manually" button functional | ✅ |
| Engine utility tests | ✅ |
| QA check extended with GoldInputSnapshot | ✅ |
| All structured logger usage consistent | ✅ |
