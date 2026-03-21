# Bug Report — Commercial Insights Platform E2E Testing

**Date:** 2026-03-20
**Test suite:** Full E2E (Playwright + API)
**Last updated:** 2026-03-20 (Phase 2 aggregation + post-run fixes)

## Status Summary

| Bug ID | Priority | Area | Status |
|--------|----------|------|--------|
| BUG-A01 | P0 | Auth — login race condition | **FIXED** (commit e723cfa) |
| BUG-A02 | P2 | Auth — no error on bad credentials | **FIXED** (commit e723cfa) |
| BUG-A03 | P1 | Auth — rate limit test spec defect | **OPEN** (test fix needed, not app bug) |
| BUG-I02 | P2 | Insights/Actions/DataMapping — modal missing `role="dialog"` | **FIXED** |
| BUG-DM01 | P1 | Data Mapping — page doesn't exist | **INVALID** (page exists) |
| BUG-API02 | P2 | API — POST /api/actions validation ordering | **NEEDS RE-TEST** (DB required) |
| BUG-AC01 | P0 | Infrastructure — DB crash under load | **OPEN** (restart DB + dev server) |
| BUG-H01 | P0 | Infrastructure — all home tests blocked | **OPEN** (same: restart DB) |
| BUG-I01 | P0 | Infrastructure — all insights tests blocked | **OPEN** (same: restart DB) |
| BUG-S01 | P0 | Infrastructure — all settings tests blocked | **OPEN** (same: restart DB) |
| BUG-DM02 | P0 | Infrastructure — all DM tests blocked | **OPEN** (same: restart DB) |
| BUG-API01 | P0 | Infrastructure — all API tests blocked | **OPEN** (same: restart DB) |

**Actionable items:**
1. **Restart PostgreSQL + dev server** (user action required — Windows EPERM prevents bash restart)
2. Re-run all 6 test agents after DB is healthy
3. Fix BUG-A03: add `await page.goto(BASE)` before `page.evaluate` in T10 of auth.spec.ts
4. Verify BUG-API02 once DB is running

## Severity Legend
| Priority | Definition |
|----------|------------|
| **P0** | App broken / data exposure: crash on load, cross-tenant data leak, auth bypass, data loss |
| **P1** | Core workflow broken: button does nothing, data doesn't load, form can't submit, wrong data shown |
| **P2** | UX degraded: missing toast, empty state absent, cosmetic misalignment, non-critical feature broken |

---

## Bugs

_Populated by test agents — see individual results files for raw test output._

<!-- BUG ENTRIES APPENDED HERE BY AGENTS -->

## ~~BUG-DM01~~ — INVALID — `/data-mapping` page EXISTS
- **Status:** CLOSED — Test Agent 6 incorrectly reported this route as missing
- **Verification:** `app/(app)/data-mapping/` directory contains `page.tsx`, `DataMappingClient.tsx`, and `UploadMappingWizard.tsx` — the page is fully implemented
- **Action:** DM1–DM7 tests should be re-run once DB is restored; route existence is confirmed

## BUG-DM02 — All DM tests blocked by database unavailability
- **Priority:** P0
- **Area:** Infrastructure / Data Mapping
- **Test:** DM1–DM7
- **Expected:** Tests can log in and exercise the data mapping UI
- **Actual:** PostgreSQL at `localhost:5432` is not running; `POST /api/auth/login` returns HTTP 500; no session cookie is issued; all authenticated page navigations redirect back to `/login`; `waitForURL(/home/)` times out after 15 s in every test
- **Steps to reproduce:**
  1. Ensure PostgreSQL is not running
  2. Run any Playwright test that calls the `login()` helper
  3. Observe: `TimeoutError: page.waitForURL: Timeout 15000ms exceeded`

## BUG-API01 — All authenticated API endpoints return 500 due to database unavailability
- **Priority:** P0
- **Area:** Infrastructure / API
- **Test:** API-1, API-2, API-4, API-6, API-7
- **Expected:** API routes return appropriate responses (200, 400, 404)
- **Actual:** HTTP 500 "Internal Server Error" — PostgreSQL at `postgresql://postgres:admin@localhost:5432/commercial_insights` is not accepting connections; every Prisma call throws, causing a generic 500
- **Steps to reproduce:**
  1. Stop PostgreSQL
  2. Make any authenticated request to a route that uses Prisma (e.g., `GET /api/brands`)
  3. Observe: HTTP 500 with body "Internal Server Error"

## BUG-API02 — POST /api/actions missing title returns 500 not 400 (validation ordering — needs re-verification)
- **Priority:** P2
- **Area:** API / Input Validation
- **Test:** API-7
- **Expected:** `POST /api/actions` without `title` field returns HTTP 400 with error message
- **Actual:** HTTP 500 (during this test run the DB was unavailable; needs re-test when DB is online to confirm if validation fires before DB/auth checks)
- **Steps to reproduce:**
  1. Start DB and obtain valid session cookie
  2. `POST /api/actions` with body: `{"brandCode":"ONC-101","owner":"Test","dueDate":"2026-04-01","severity":"High","linkedInsight":"test"}` (no `title` field)
  3. Expected: HTTP 400; actual status TBD when DB is available

## ~~BUG-A01~~ — FIXED — Login success does not navigate to /home
- **Priority:** P0
- **Status:** FIXED — commit `e723cfa`
- **Area:** Auth
- **Fix:** `router.push('/home')` → `window.location.href = '/home'` in `app/login/page.tsx`. Ensures `Set-Cookie` is committed by browser before navigation begins.

## ~~BUG-A02~~ — FIXED — Login form shows no error message on failed authentication
- **Priority:** P2
- **Status:** FIXED — commit `e723cfa`
- **Area:** Auth
- **Fix:** Added `useState` error state + red error paragraph in `app/login/page.tsx`. Invalid credentials now show "Invalid email or password".

## BUG-A03 — Rate limit test blocked by same-origin policy (test spec bug)
- **Priority:** P1
- **Area:** Auth / Rate Limiting
- **Test:** T10 — rate limiting returns 429
- **Expected:** Multiple wrong login attempts to `/api/auth/login` eventually return HTTP 429
- **Actual:** `TypeError: Failed to fetch` — fetch is blocked because `page.evaluate` runs from `about:blank` with no origin
- **Steps to reproduce:**
  1. Run T10 as written (no `page.goto()` before `page.evaluate`)
  2. Observe: `TypeError: Failed to fetch` on first attempt
- **Note:** This is a test spec defect, not an application bug. Rate limiting is implemented in `lib/rate-limit.ts` (MAX_ATTEMPTS=5). Fix: add `await page.goto(BASE)` before the `page.evaluate` block in T10.

## BUG-AC01 — Dev server returns HTTP 500 on all routes during test run
- **Priority:** P0
- **Area:** Infrastructure / Actions
- **Test:** AC1–AC9 — all BLOCKED
- **Expected:** Dev server responds correctly; all routes return 200/307 as appropriate
- **Actual:** After initial startup (HTTP 307 working), server degraded to returning HTTP 500 "Internal Server Error" on all routes including the public `/login` page. Even `GET /login` returns 500.
- **Steps to reproduce:**
  1. Start dev server (`npm run dev`) — server initially responds correctly
  2. Run 6+ concurrent E2E test agents simultaneously
  3. After or during concurrent runs, observe server returning 500 on all routes
  4. Verify: `GET http://localhost:3000/login` returns "Internal Server Error"
- **Root cause hypothesis:** PostgreSQL DB connection pool exhausted under concurrent test load, or DB process crashed. The Next.js middleware queries Prisma on every request (fail-closed). If DB is unavailable, all routes including public ones return 500.
- **Related:** BUG-DM02, BUG-API01 — same root cause (DB unavailable) seen across other test agents.
- **Fix:** Check PostgreSQL process status; increase Prisma connection pool limit; add graceful 503 fallback instead of unhandled 500 when DB is unreachable.

## BUG-S01 — All Settings tests blocked by database unavailability (login fails)
- **Priority:** P0
- **Area:** Infrastructure / Settings
- **Test:** S1–S10 — all BLOCKED
- **Expected:** Tests log in successfully and exercise the `/settings` page (profile form, notification toggles, data preferences, security section)
- **Actual:** PostgreSQL at `localhost:5432` is not running; `POST /api/auth/login` returns HTTP 500; `window.location.href = '/home'` is never reached; `waitForURL(/home/)` times out after 15 s in S1. S2–S10 each timeout at 45 s waiting for `input[type="email"]` on the login form (browser unable to complete form hydration / stuck after prior auth failure).
- **Steps to reproduce:**
  1. Ensure PostgreSQL is not running (or has crashed)
  2. Run `npx playwright test testing/settings.spec.ts`
  3. S1: `TimeoutError: page.waitForURL: Timeout 15000ms exceeded` — page navigates to `/login` → `/login`
  4. S2–S10: `Test timeout of 45000ms exceeded` — waiting for `locator('input[type="email"]')`
- **Related:** BUG-DM02, BUG-A01, BUG-API01, BUG-AC01 — same infrastructure root cause across all test agents
- **Note:** Source inspection confirms the settings page is fully implemented (`app/(app)/settings/page.tsx`). All features (profile edit, email read-only, notification toggles with PATCH, data preferences, security controls disabled) exist in code. Tests cannot be validated until the database is restored.

## BUG-I01 — All Insights tests blocked by database unavailability
- **Priority:** P0
- **Area:** Infrastructure / Insights
- **Test:** I1–I14 — all BLOCKED
- **Expected:** PostgreSQL is running; tests can log in and exercise the /insights and /insights/:id pages
- **Actual:** PostgreSQL at `localhost:5432` is not running; all Prisma calls throw; `POST /api/auth/login` returns HTTP 500; `waitForURL(/home/)` times out; all 14 tests timeout at 45 s
- **Steps to reproduce:**
  1. Stop PostgreSQL (or ensure it is not running)
  2. Run `npx playwright test testing/insights.spec.ts`
  3. Observe: all 14 tests timeout at 45 s — "Test timeout of 45000ms exceeded"
- **Related:** BUG-DM02, BUG-API01, BUG-AC01, BUG-S01 — same infrastructure root cause across all test agents

## ~~BUG-I02~~ — FIXED — Create action modal has no accessible role or detectable class
- **Priority:** P2
- **Status:** FIXED
- **Area:** Insights / Accessibility
- **Fix applied:** Added `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` to all modal panels:
  - `app/(app)/insights/[id]/InsightDetailClient.tsx` — Create Action modal
  - `app/(app)/actions/ActionsClient.tsx` — Create Action Manually + Record Impact modals
  - `app/(app)/data-mapping/DataMappingClient.tsx` — Edit Mapping Status modal
  - `app/(app)/data-mapping/UploadMappingWizard.tsx` — Upload Mapping slide-over

## BUG-H01 — All Home page tests blocked by database unavailability
- **Priority:** P0
- **Area:** Home / Infrastructure
- **Test:** H1–H11 — all BLOCKED
- **Expected:** Dev server is stable, PostgreSQL is running, login succeeds, home page loads with KPI tiles, insights, and actions
- **Actual:** PostgreSQL unavailable → login API returns 500 → all authenticated tests timeout; `page.fill('input[name="email"]')` times out at 90 s because the login form never renders (server returns 500 or hangs on networkidle)
- **Steps to reproduce:**
  1. Ensure PostgreSQL is not running (or has crashed)
  2. Run `npx playwright test testing/home.spec.ts`
  3. Observe: all 11 tests timeout — `page.fill: Test timeout of 90000ms exceeded` (login form never renders)
- **Related:** BUG-DM02, BUG-API01, BUG-AC01, BUG-S01, BUG-I01 — same P0 infrastructure root cause across all test agents
- **Fix:** Restore PostgreSQL. Long-term: add DB connection retry logic and graceful 503 fallback instead of unhandled 500 when DB is unreachable.
