# Commercial Insights Platform — Full Project History

Generated: 2026-03-23

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

### Sprint 5b — QA Bug Fixes (complete)

Pre-Sprint 6 stabilisation pass that fixed a wave of bugs found through manual QA:

**Home / KPI tiles:**
- Fixed severity ordering — replaced alphabetical Prisma sort with `sortBySeverityDesc()` utility (`lib/severity.ts`)
- Replaced formulary structure logic with territory integrity: new `TerritoryChangeLog` schema + migration, `structure-territory-churn` engine template, territory-based KPI tile calculation
- Fixed Demand Momentum KPI tile to show NRx count (not WoW %)
- Fixed `timeWindow`/`geography` filter applied to `dataRun` query

**Insights Explorer:**
- Fixed `timeWindow`/`geography` scoping in `dataRun` query
- Fixed misleading pagination count (filtered count vs total DB count)
- Centralized insight statuses: `INSIGHT_STATUSES` + `InsightStatus` exported from `lib/severity.ts`

**Insight Detail:**
- Fixed hardcoded `brandCode: 'ONC-101'` in action creation — now uses `useFilters().brand`
- Fixed static evidence `dataSources` — now derived from `PILLAR_SOURCES` map + `insight.metricChanges`
- Added brand ownership check to `PATCH /api/insights/[id]`
- All PATCH calls (status + notes) now include `brandCode`

**Data Mapping UI Wizard:**
- `UploadMappingWizard.tsx` (new) — multi-step wizard for uploading field mapping configurations
- `app/api/data-mapping/configs/route.ts`, `rules/route.ts`, `upload/route.ts` — new API endpoints backing the wizard

---

### Sprint 6 — Security Hardening + DB Indexes + CI Type-Check (complete, 2026-03-18)

**Security fixes:**
- Brand ownership checks added to `PATCH /api/actions/[id]`, `GET /api/insights/[id]`, and `POST /api/runs/[id]/generate-insights` — return 404 on mismatch
- XSS fixed in exec-pack HTML export via `escHtml()` helper applied to all 21 user-data insertion sites
- `validateActionBody` and `validateActionPatchBody` wired in action routes (was imported but not called)
- All logging standardized to `lib/logger` — removed remaining `console.error` from AI routes and brands route
- `try-catch` around `request.json()` in login route — returns 400 on malformed body instead of 500

**Performance:**
- 14 DB indexes added across 11 models (`fact` tables, `DataRun`, `Insight`, `Driver`, `MetricChange`, `Contributor`, `InsightRisk`, `GoldInputSnapshot`)

**UX:**
- Fixed pagination URL param loss in `InsightsClient` — brand/geography/timeWindow now preserved across page navigation

**CI:**
- Added `npx tsc --noEmit` type-check step to GitHub Actions workflow

---

### Sprint 7 — Real Authentication (complete, 2026-03-18)

Replaced demo auth (static `'authenticated'` cookie) with production-grade JWT authentication.

**New files:**
- `lib/auth.ts` — JWT sign/verify using `jose` (HS256, 8h expiry, reads `JWT_SECRET` from env)
- `lib/rate-limit.ts` — in-memory Map rate limiter (5 attempts / 15-min lockout per email)
- `app/api/auth/me/route.ts` — GET endpoint returning authenticated user profile from DB

**Schema change** (migration: `add_user_model`):
- `User` model — `id`, `email`, `passwordHash`, `name`, `role`, `orgId`
- Demo user `alex@company.com` seeded with bcrypt-hashed password

**Security fixes applied in the same sprint:**
- Timing attack: `DUMMY_HASH` constant — `bcrypt.compare()` always runs even when user not found
- Header spoofing: middleware strips all 4 identity headers before setting them from JWT (prevents client-supplied `x-user-*` headers leaking through)
- Rate limiter: `pruneExpiredEntries()` called on every check (passive cleanup, avoids hot-reload memory issues)
- JWT revocation: `tokenVersion Int @default(1)` added to `User`; middleware does a lightweight DB `tokenVersion` check on every authenticated request — token is immediately invalidated when version doesn't match (migration: `auth_security_fixes`)
- Redundant `@@index([email])` removed (covered by `@unique`)

**Key decisions:**
- `bcryptjs` (not `bcrypt`) — pure JS, no native bindings, works on Windows + Linux CI
- `jose` (not `jsonwebtoken`) — required for Next.js Edge Runtime in middleware
- Same 401 for user-not-found and wrong password — prevents user enumeration

---

### Sprint 8 — Multi-Tenancy Enforcement + Settings Persistence + AI Rate Limiting (complete, 2026-03-19)

**Schema** (migration: `sprint8_schema`):
- `Brand.orgId` changed from nullable `String?` to `NOT NULL String @default("org_default")` — enforces tenant isolation at DB level
- `UserPreference` model added — per-user notification/display preferences linked to `User.id`

**New lib files:**
- `lib/request-context.ts` — `getOrgId`, `getUserId`, `getUserRole`, `assertBrandAccess` helpers
- `lib/api-rate-limit.ts` — sliding window rate limiter for API endpoints (separate from login rate limiter)

**API route enforcement (14 routes):**
All brand-scoped API routes now call `assertBrandAccess(orgId, brandCode)` before any data access. Cross-tenant access returns 404 (not 403) to avoid confirming resource existence.
- `brands`, `insights`, `insights/[id]`, `actions`, `actions/[id]`, `runs`, `runs/[id]/generate-insights`, `data-status`, `admin/data-status`, `engine/run` (+ engine rate limit: 5 req/min), `data-mapping/configs`, `data-mapping/rules`, `data-mapping/upload`, `export/exec-pack`

**Settings + UI:**
- `GET/PATCH /api/settings/preferences` — upserts `UserPreference` by userId
- `PATCH /api/auth/me` — name update endpoint
- `app/(app)/settings/page.tsx` — fully rewritten with controlled state + real API calls + sonner toasts
- `app/(app)/layout.tsx` — `<Toaster />` (sonner, bottom-right) added to app shell

**AI rate limiting:**
- `summary`, `insight-narrative`, `pulse-brief` — all call `checkApiRateLimit(userId, 'ai')` → 20 req/min per user

---

### Sprint 9 — UX Completeness (complete, 2026-03-19)

**Quick wins:**
- `HomeClient` — replaced `console.error` with `logger.error`; `toast.error` on pulse brief failure
- `Sidebar` — dynamic "Last data drop" timestamp: `AppLayout` fetches latest `DataRun.runAt`, passes as `lastRunAt` prop, rendered in ET timezone
- `InsightDetailClient` — Share button wired to `navigator.clipboard.writeText(window.location.href)` + `toast.success('Link copied')`
- `InsightDetailClient` — Save Notes wrapped in try/catch with success/error toasts
- `DataMappingClient` — `saveEdit` wrapped in try/catch with error toast

**Export Selected (Insights):**
- `InsightsClient.tsx` — row checkboxes, select-all header checkbox, Export button shows count badge, disabled when nothing selected
- `lib/export-csv.ts` (new) — pure `exportInsightsToCsv(insights)` — builds 8-column CSV, triggers browser download via Blob

**Notification Bell:**
- `components/layout/NotificationPanel.tsx` (new) — shadcn Popover; lazy-fetches critical insights + due actions on open; loading skeleton, empty state, sectioned list with links; red dot only shown when there are notifications
- `TopBar.tsx` — static bell replaced with `<NotificationPanel />`

---

### Post-Sprint 9 — Edge Runtime Fix + Accessibility (complete, 2026-03-21)

**Critical bug fix — middleware Edge Runtime:**

**Symptom:** After login, app bounced back to `/login` instead of loading `/home`.

**Root cause:** `middleware.ts` imported `PrismaClient` for `tokenVersion` DB check. Next.js middleware runs in Edge Runtime, which does not support Node.js APIs. Every DB call threw, catch block deleted the cookie, so every authenticated request was denied.

**Fix:**
- `app/api/auth/verify-session/route.ts` (new) — internal-only Node.js route that does the `tokenVersion` DB check, protected by `INTERNAL_SECRET` header
- `middleware.ts` — removed Prisma import; now calls `fetch('/api/auth/verify-session')` with the internal secret
- Fail-closed: any non-200 from verify-session denies access

**Accessibility improvements:**
Added `role="dialog"`, `aria-modal="true"`, `aria-labelledby` to all custom modal overlays:
- `ActionsClient.tsx` — "Create Action Item" + "Record Impact" modals
- `DataMappingClient.tsx` — "Edit Mapping Status" modal
- `UploadMappingWizard.tsx` — upload wizard drawer
- `InsightDetailClient.tsx` — "Create Action Item" modal

---

### Sprint 10 — Security & Compliance Hardening (complete, 2026-03-21)

**Critical auth bypass fixed:**
- `app/api/home/route.ts` — added `getOrgId()` + `assertBrandAccess()`, matching the pattern used by all other protected routes. Cross-tenant callers now receive 404 (no resource existence leak).

**AI route hardening:**
- All 3 AI routes (`insight-narrative`, `pulse-brief`, `summary`) — replaced `?? 'anonymous'` rate-limit fallback with early 401 return when `x-user-id` header is missing.

**Audit trail fix:**
- `app/api/data-mapping/upload/route.ts` — replaced hardcoded `publishedBy: 'Admin'` with `getUserId(request)`. Added 200-char length validation on `name` field.

**Logger compliance:**
- `lib/impact-evaluator.ts` — replaced 2 `console.warn/error` calls with `logger.warn/error` (CLAUDE.md rule enforcement).

**Security headers:**
- `next.config.ts` — added `async headers()` with `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Content-Security-Policy` on all routes.

**Input validation:**
- `app/api/insights/route.ts` — added 200-char length guard on `search` query param (DoS mitigation).

**Test config:**
- `vitest.config.ts` — restricted collection to `__tests__/**/*.test.ts`, excluding `testing/` Playwright files.

**Verification at Sprint 10 end:**
- ✅ `npx tsc --noEmit` → 0 errors
- ✅ `npx vitest run` → 44/44 passing
- ✅ `npx tsx scripts/qa-check.ts` → 114/114
- ✅ `npx tsx scripts/regression-check.ts` → 16/16

---

### Sprint 11 — Insights & Actions End-to-End Fixes (complete, 2026-03-21)

**Bug fixes:**
- Notification bell — severity filter was `critical` (should be `High`); bell was always empty
- `GET /api/insights/[id]` — now includes `actions` relation so linked actions show on detail page
- Kanban drag `PATCH` — now sends `brandCode` in request body (drag-and-drop was returning 400)
- Insight detail status change — now shows success toast on update
- Notes save — removed `onBlur` auto-save; save button only (eliminates race condition with status updates)

**Features:**
- FilterContext (brand/timeWindow) now drives URL push → server re-fetch on insights list page
- Refresh Insights button on insights page — triggers `POST /api/engine/run` with rate-limit handling (429 → `toast.error`)
- AI narrative retry button + 429-specific error message

---

### Sprint 12 — Home & Insights Filter Fixes (complete, 2026-03-22)

**`FilterContext.tsx`:**
- Initialized `brand`, `timeWindow`, `geography` from `useSearchParams()` instead of hardcoded defaults
- Split into `FilterProviderInner` (uses hook) + `FilterProvider` (wraps in `<Suspense>`) — required pattern for Next.js 15

**Home page geography fallback:**
- If requested geography has no `DataRun`, falls back to `geography: 'Nation'`
- `geographyFallback` flag computed after query (not before), preventing false banner
- `HomeClient` shows info banner: "No data available for [geography] — showing Nation-level data"

**Insights page:**
- Same geography fallback pattern
- `pillar` filter moved fully server-side in Prisma `where` clause (was client-side only — broke pagination)
- `VALID_PILLARS` allowlist to silently ignore invalid URL params
- Pillar dropdown calls `router.push()` with `?pillar=Demand` in URL

**`InsightsClient` useEffect guard:**
- Only navigates if filter state differs from current URL — prevents page-1 reset on every mount

---

### Sprint 13 — Data Mapping Fixes (complete, 2026-03-22)

**Removed dead button:**
- "Test on Sample" button removed from `DataMappingClient.tsx` header — had no backing feature

**Normalization Rules edit modal:**
- `PATCH /api/data-mapping/rules` — new handler with `id`, `normalizedValue`, `category`, `brandCode` validation + brand ownership check
- `DataMappingClient.tsx` — edit modal (accessible, `role="dialog"`) with `normalizedValue` input and `category` select; updates local state on save without page reload

**CrosswalkStat model + dynamic ID Crosswalk:**
- `CrosswalkStat` model added to schema: `brandId`, `statType`, `label`, `matchRate`, `unmatchedCount`, `entityType` (migration: `add_crosswalk_stat`)
- 3 rows seeded per brand: `npi_coverage` (94.2%), `account_id_match` (97.8%), `territory_alignment` (100%)
- `DataMappingClient` — hardcoded crosswalk array replaced with live DB data; color thresholds ≥95% green, ≥85% amber, <85% red

---

### Sprint 14 — Logout Logger + Engine Threshold Centralization (complete, 2026-03-22)

**Logout audit trail:**
- `app/api/auth/logout/route.ts` — added `logger.info('User logged out', ...)` (last API route missing structured logging)

**Engine threshold centralization:**
- `lib/insight-engine/thresholds.ts` (new) — single source of truth for all 25 alert/severity thresholds as `as const` object
- `lib/insight-engine/utils.ts` — `deriveSeverity()` references `THRESHOLDS.severityHighChangePct`/`severityMedChangePct`
- All 6 engine template files updated — no more magic numbers; all thresholds imported from `thresholds.ts`

**New tests (20 added, 64 total):**
- `__tests__/thresholds.test.ts` (7) — all 25 keys exist, are positive numbers, ordering invariants hold
- `__tests__/engine-thresholds-integration.test.ts` (13) — boundary tests for all 6 templates; reference `THRESHOLDS.*` so they stay green if values are tuned

---

### Sprint 15 — Bronze Data Layer + Ingest API (complete, 2026-03-22)

Added a full raw data ingestion layer — the Bronze tier of the Medallion architecture.

**17 new Prisma models** (migration: `add_bronze_layer`):
- 6 control/audit tables (`BronzeCtl*`): `IngestionRun`, `FileManifest`, `RowRejection`, `SchemaRegistry`, `MappingValidationIssue`, `UnmappedFieldsRegistry`
- 11 raw business tables (`Bronze*Raw`): `Claims`, `SpCases`, `SpStatusHistory`, `Dispense`, `Shipments`, `Calls`, `HcpMaster`, `HcoMaster`, `Affiliations`, `TerritoryAlignment`, `RepRoster`
- 25-field common metadata block on every raw table (client/brand/source/ingestion lineage + parse status + `rawPayload Json`)

**`lib/ingest-helpers.ts`** (new): `computeRowHash(row)` — SHA-256 of `JSON.stringify(row)` for deduplication

**`POST /api/ingest/facts`** (new):
Accepts raw payloads for any of the 11 Bronze tables in one call.
1. Validates required fields
2. RBAC: `getOrgId` + `assertBrandAccess`
3. Creates `BronzeCtlIngestionRun` (status: running)
4. Creates `BronzeCtlFileManifest`
5. Inserts rows with `recordHash`; failed rows → `BronzeCtlRowRejection` (valid rows still ingest)
6. Updates control records with final counts/status
7. Creates `DataRun` → `runInsightEngine` → `evaluateActions` (same as `engine/run`)
8. Returns `{ ok, ingestionRunId, dataRunId, accepted, rejected, insightsCreated, actionsEvaluated }`

**Key design:** append-only, typed columns + `rawPayload` blob, `clientId` on every model for future multi-tenant separation.

---

### Sprint 16 — Bronze Ingestion Visibility + Wizard Real Fields (complete, 2026-03-22)

**`GET /api/ingest/runs`** (new):
Returns last N `BronzeCtlIngestionRun` rows for a brand (with up to 3 `FileManifest` children). BigInt fields converted to Number before serialization.

**Data Mapping page — Recent Ingestion Runs section:**
- `DataMappingClient.tsx` — added "Recent Ingestion Runs" table in "Latest Drop Status" tab: color-coded status badge, start time, rows loaded/rejected, file name
- Empty state: "No ingestion runs yet — use POST /api/ingest/facts to push data."

**Upload Mapping Wizard — real Bronze field definitions:**
- `BRONZE_TARGET_FIELDS` map added — dataset-keyed record of actual Bronze raw table column names (Claims: 36, SP Cases: 23, Calls: 22, Dispense: 16, Structure: 24)
- Target field dropdown resolves the correct column list per selected dataset
- Upload step: replaced `simulateUpload()` (fake setTimeout) with real `<input type="file">` picker that reads actual file name/size

**Upload API updated:**
- `RuleInput` changed from `{ hubValue, normalizedValue, category }` to `{ sourceField, targetField }` — stores as `NormalizationRule` with `ruleType: 'field_mapping'`

---

### Sprint 17 — Playwright E2E Test Suite (complete, 2026-03-21)

Added a comprehensive Playwright end-to-end test suite covering all major application flows.

**Test files added (`testing/`):**
- `auth.spec.ts` — full authentication flow: login, logout, session persistence, rate limiting
- `auth-diag.spec.ts`, `auth-diag2.spec.ts` — auth diagnostics and edge cases
- `insights.spec.ts` — insights list, filtering, detail page, AI narrative, status changes
- `settings.spec.ts` — settings page: profile update, preferences, display options

**Test result documentation:**
- `testing/results-auth.md` — auth test results
- `testing/results-home.md` — home page test results
- `testing/results-insights.md` — insights test results
- `testing/results-actions.md` — actions/Kanban test results
- `testing/results-data-mapping.md` — data mapping test results
- `testing/results-api.md` — API endpoint test results
- `testing/results-settings.md` — settings test results
- `testing/bugs.md` — bugs found and tracked during testing

**Note:** Vitest config (`vitest.config.ts`) restricts unit test collection to `__tests__/**/*.test.ts` to exclude Playwright files from the unit test run.

---

### Sprint 18 — Assign Button with AI-Powered Action Suggestions (complete, 2026-03-22)

Wired the dead Assign button on home page insight rows into a full action-creation flow with AI assistance.

**`POST /api/ai/action-suggestions`** (new):
Takes insight context (`headline`, `pillar`, `severity`, `impact`, `region`) and returns 2-3 AI-generated action suggestions via Claude Opus 4.6. Same pattern as `pulse-brief`: `x-user-id` auth, `checkApiRateLimit('ai')`, ephemeral system prompt cache, JSON parse with try/catch (502 on failure), hallucination guard, structured logging.

**`components/InsightRow.tsx`:**
Added optional `onAssign?: (insight: InsightData) => void` prop — wired to the existing Assign button. Backward-compatible.

**`app/(app)/home/HomeClient.tsx`:**
- 8 new state variables for the Assign modal flow
- Assign modal: raw `fixed inset-0` overlay (consistent with ActionsClient pattern), AI suggestion cards, form with title/owner/due date/expected lag
- Newly created actions prepend to "What to Do Next" section immediately (no page reload) via `localActions` state
- `severity` inherited from insight (not a form field)

**`components/ui/tooltip.tsx`:**
Fixed `TooltipContent` — applied inline `backgroundColor: '#0F172A'`, `color: '#ffffff'` for correct rendering in Radix portal context.

---

### Sprint 19 — Owner Dropdown Populated from Org Users (complete, 2026-03-23)

**`GET /api/users`** (new):
Returns all users in the current org (scoped by `x-org-id` header). No pagination — intended for dropdown population.

**Assign modal (HomeClient):**
Owner text input replaced with a dropdown populated from `GET /api/users`. Falls back to text input if the fetch fails.

**Create Action modal (ActionsClient):**
Same dropdown pattern applied. Stores user display name in `Action.owner` — no schema change required.

---

### Sprint 20 — Pre-RBAC Hardening (complete, 2026-03-23)

Preparatory work directly preceding the Sprint 21 RBAC rollout:
- Verified all brand-scoped routes consistently use `assertBrandAccess` pattern
- Confirmed `getUserRole(request)` was consistently available in `lib/request-context.ts` from Sprint 8
- Identified all API routes needing `requireRole` gates (engine run, action create, action delete, AI routes, data mapping routes)
- Reviewed frontend components for gating points (Sidebar, data-mapping redirect, HomeClient buttons, InsightsClient buttons, ActionsClient buttons)
- This sprint produced the architectural plan that Sprint 21 executed against

---

### Sprint 21 — Full RBAC: Brand-Level Access Control (complete, 2026-03-23)

Implemented a complete role-based + brand-level access control system.

**New role hierarchy (6 levels):** `sales_rep` → `regional_director` → `executive` → `national_manager` → `analytics_manager` → `admin`

**What was built:**
- `UserBrandRole` junction table — users are assigned to specific brands with a role (one role per user per brand), `@@unique([userId, brandId])`
- `Action.isActive` field — soft delete support (deleted actions set `isActive = false`, never removed from DB)
- `lib/roles.ts` — `ROLE_HIERARCHY` constant + `hasMinRole()` helper (client-safe, no Prisma)
- `lib/request-context.ts` — `requireRole()`, `assertUserBrandAccess()` helpers for API enforcement
- Role gates on all mutation API routes (engine run, action create/delete, AI features, data mapping)
- `assertUserBrandAccess` on all brand-scoped GET routes (admin bypasses; returns 404, not 403)
- `GET /api/brands` now filters to user's assigned brands (admin sees all)
- Frontend: Sidebar hides Data & Mapping for non-admin; Data Mapping page server-redirects non-admin to `/home`; buttons conditionally rendered by role in HomeClient, InsightsClient, ActionsClient
- Demo seed updated to create `UserBrandRole` row for Alex (ONC-101, analytics_manager)

**Permission matrix (key rows):**
| Feature | sales_rep | regional_director | executive | analytics_manager | admin |
|---|---|---|---|---|---|
| View insights/actions | ✅ own brands | ✅ own brands | ✅ own brands | ✅ own brands | ✅ all |
| Create actions | ❌ | ✅ | ✅ | ✅ | ✅ |
| Delete actions (soft) | ❌ | ❌ | ✅ | ✅ | ✅ |
| AI Pulse Brief / Export | ❌ | ❌ | ✅ | ✅ | ✅ |
| Refresh Insights (engine) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Data & Mapping page | ❌ | ❌ | ❌ | ✅ | ✅ |

**Full documentation:** `notes/2026-03-23-sprint21-rbac.md`

**Key files for RBAC understanding:**
- `lib/roles.ts` — role hierarchy and `hasMinRole` helper
- `lib/request-context.ts` — API enforcement helpers (`requireRole`, `assertUserBrandAccess`)
- `prisma/schema.prisma` — `UserBrandRole` model

---

## Current File Structure (key files)

```
app/
  (app)/
    home/           page.tsx + HomeClient.tsx
    insights/       page.tsx + [id]/page.tsx + [id]/InsightDetailClient.tsx
    actions/        page.tsx + ActionsClient.tsx
    data-mapping/   page.tsx + DataMappingClient.tsx + UploadMappingWizard.tsx
    settings/       page.tsx
    layout.tsx
  api/
    auth/login/            route.ts
    auth/logout/           route.ts
    auth/me/               route.ts
    auth/verify-session/   route.ts  (internal — Edge Runtime tokenVersion check)
    ai/
      insight-narrative/   route.ts
      summary/             route.ts
      pulse-brief/         route.ts
      action-suggestions/  route.ts
    insights/[id]/         route.ts  (GET + PATCH — status + notes)
    actions/               route.ts  (GET + POST)
    actions/[id]/          route.ts  (PATCH + DELETE soft-delete)
    engine/run/            route.ts  (POST — triggers insight engine + evaluateActions)
    runs/[id]/generate-insights/  route.ts
    export/exec-pack/      route.ts  (GET — HTML exec pack)
    ingest/facts/          route.ts  (POST — Bronze ingest)
    ingest/runs/           route.ts  (GET — ingestion run history)
    brands/                route.ts  (GET — filtered by UserBrandRole for non-admin)
    users/                 route.ts  (GET — org users for dropdowns)
    settings/preferences/  route.ts
    data-mapping/
      configs/             route.ts
      rules/               route.ts  (GET + PATCH)
      upload/              route.ts
    admin/data-status/     route.ts
  login/            page.tsx
  page.tsx          (redirects to /home)
  layout.tsx

lib/
  prisma.ts                   Prisma client singleton
  logger.ts                   Structured JSON logger
  auth.ts                     JWT sign/verify (jose)
  rate-limit.ts               Login brute-force rate limiter
  api-rate-limit.ts           API endpoint sliding window rate limiter
  request-context.ts          getOrgId, getUserId, getUserRole, assertBrandAccess,
                              requireRole, assertUserBrandAccess
  roles.ts                    ROLE_HIERARCHY + hasMinRole (client-safe)
  severity.ts                 sortBySeverityDesc, INSIGHT_STATUSES
  actions-validation.ts       validateActionBody, validateImpactScoreBody
  ingest-helpers.ts           computeRowHash (SHA-256)
  export-csv.ts               exportInsightsToCsv (client-side browser download)
  impact-evaluator.ts         evaluateActions, lagToDays, computeVerdict
  insight-engine/
    index.ts                  Main engine (runInsightEngine)
    utils.ts                  Pure functions (deriveConfidence, deriveSeverity, etc.)
    thresholds.ts             25 named alert/severity thresholds (single source of truth)
    templates/                6 insight template files

prisma/
  schema.prisma               Full DB schema (40+ models including Bronze layer + RBAC)
  seed.ts                     Demo data seeder (npm run demo:reset)
  migrations/                 All applied migrations

scripts/
  qa-check.ts                 114-assertion structural QA
  regression-check.ts         Idempotency + missing-data regression tests
  sprint14-check.ts           Threshold centralization smoke checks
  sprint15-check.ts           Bronze layer existence smoke checks
  demo-script.md              Sales demo walkthrough script

__tests__/
  impact-evaluator.test.ts              14 tests
  actions-validation.test.ts            11 tests
  insight-engine.test.ts                19 tests
  thresholds.test.ts                    7 tests
  engine-thresholds-integration.test.ts 13 tests
  ingest-helpers.test.ts                6 tests

testing/                      Playwright E2E tests (excluded from vitest run)
  auth.spec.ts
  insights.spec.ts
  settings.spec.ts

.github/workflows/ci.yml      CI pipeline (npm ci → prisma generate → lint → tsc → test)
vitest.config.ts              Vitest config with @ alias
middleware.ts                 Auth middleware (JWT verify → internal verify-session fetch)
next.config.ts                Security headers (CSP, X-Frame-Options, etc.)
```

---

## Database Schema (key models)

| Model | Purpose |
|-------|---------|
| `Brand` | Brand record (ONC-101) |
| `User` | Authenticated user (email, passwordHash, role, orgId, tokenVersion) |
| `UserBrandRole` | User → brand assignment with role (Sprint 21 RBAC) |
| `UserPreference` | Per-user notification/display preferences |
| `DataRun` | Each engine run / time window |
| `Insight` | Engine-generated insight (notes, status, isActive) |
| `Driver` | Why the insight occurred |
| `MetricChange` | Before/after metric values |
| `Contributor` | Geographic/entity breakdown |
| `InsightRisk` | Confidence flags |
| `Action` | Kanban action items (isActive for soft delete) |
| `ImpactScore` | Outcome measurement for done actions |
| `KpiTile` | Dashboard KPI tiles (4 per run) |
| `Dataset` | Data freshness panel |
| `GoldInputSnapshot` | Raw evidence snapshot per engine run |
| `ClaimsMetricsFact` | Weekly Rx claim data |
| `SpMetricsFact` | SP case / TTT data |
| `CallsMetricsFact` | Field rep call compliance data |
| `StructureChangeLog` | Territory/formulary structure changes |
| `CrosswalkStat` | ID crosswalk match rates per brand |
| `NormalizationRule` | Field mapping + value normalization rules |
| `BronzeCtlIngestionRun` | Bronze pipeline run audit (Sprint 15) |
| `BronzeCtlFileManifest` | Per-file ingestion metadata |
| `BronzeCtlRowRejection` | Failed row tracking |
| `Bronze*Raw` (11 models) | Raw business tables: Claims, SpCases, Calls, etc. |

---

## Key Commands

```bash
npm run dev                          # Start dev server (port 3000)
npm run demo:reset                   # Wipe + reseed database
npm run test                         # Run 70 vitest unit tests
npx tsx scripts/qa-check.ts          # Run 114 structural QA assertions
npx tsx scripts/regression-check.ts  # Run idempotency regression check
npx tsc --noEmit                     # TypeScript type check
npm run build                        # Production build
npm run lint                         # ESLint
```

---

## Current Test Counts

| Suite | Tests |
|-------|-------|
| `impact-evaluator.test.ts` | 14 |
| `actions-validation.test.ts` | 11 |
| `insight-engine.test.ts` | 19 |
| `thresholds.test.ts` | 7 |
| `engine-thresholds-integration.test.ts` | 13 |
| `ingest-helpers.test.ts` | 6 |
| **Total** | **70** |

---

## MVP Exit Criteria Status

| Criterion | Status |
|-----------|--------|
| Gold DB + API fully powers UI | ✅ |
| Insight generator per run | ✅ |
| AI narrative + exportable exec pack | ✅ |
| Action + impact loop across runs | ✅ |
| Real JWT auth with rate limiting + revocation | ✅ |
| Multi-tenant org isolation (assertBrandAccess) | ✅ |
| Full RBAC (6-role hierarchy + brand-level access) | ✅ |
| Bronze data ingest layer + audit trail | ✅ |
| AI action suggestions from insights | ✅ |
| Notes on insights persist | ✅ |
| Engine thresholds centralized + tested | ✅ |
| Security headers + input validation | ✅ |
| Playwright E2E test suite | ✅ |
| All structured logger usage consistent | ✅ |
