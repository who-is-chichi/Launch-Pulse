# Home Page — E2E Test Results

**Date:** 2026-03-20
**Agent:** Test Agent 2
**Tool:** Playwright (Chromium, headless)
**Base URL:** http://localhost:3002
**Dev server status:** Running at port 3002 — but returning "Internal Server Error" on all pages (database unavailable)

---

## Summary

**0 passed, 11 failed — all BLOCKED by infrastructure failure (database unavailable at test execution time)**

Every test requires authentication. The login page (`/login`) renders as "Internal Server Error" — confirmed via `test-results/*/error-context.md` page snapshots which contain only `generic [ref=e2]: Internal Server Error`. As a result, `page.fill('input[name="email"]')` times out (30 s) on every test because the email input never appears in the DOM.

This is the same P0 infrastructure failure documented in prior test runs (BUG-DM02, BUG-API01, BUG-AC01, BUG-S01, BUG-I01, BUG-H01). Root cause: PostgreSQL is not running or is unreachable; Prisma throws on every request that touches the DB; Next.js returns a 500 error page instead of the login form.

---

## Test Results

| Test | Description | Result | Notes |
|------|-------------|--------|-------|
| H1 | Home page loads without JS console errors | FAIL | Login blocked — `/login` returns Internal Server Error; email input never rendered |
| H2 | KPI tiles render with numeric values (≥1 tile) | FAIL | Login blocked |
| H3 | Insights section shows ≥1 row | FAIL | Login blocked |
| H4 | Clicking an insight row navigates to `/insights/[id]` | FAIL | Login blocked |
| H5 | Actions section shows ≥1 item | FAIL | Login blocked |
| H6 | Sidebar last data drop timestamp is not hardcoded string | FAIL | Login blocked |
| H7 | Export exec pack button exists | FAIL | Login blocked |
| H8 | Generate pulse brief button exists | FAIL | Login blocked |
| H9 | Brand dropdown shows "ONC-101" | FAIL | Login blocked |
| H10 | Notification bell opens a popover when clicked | FAIL | Login blocked |
| H11 | Sidebar nav links are functional (≥2 links navigate) | FAIL | Login blocked |

---

## Failure Details

### All H1–H11 — Login form never renders (database unavailable)

**Exact error (same for all 11 tests):**
```
Test timeout of 30000ms exceeded.

Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="email"]')
    at login (testing/home.spec.ts:7:14)
```

**Page snapshot from Playwright error-context (H10, H11):**
```yaml
- generic [ref=e2]: Internal Server Error
```

The dev server is listening on port 3002 (page.goto succeeds — no ECONNREFUSED), but the login page body is "Internal Server Error". This means:
1. Next.js SSR runs for `/login`
2. Somewhere in the login page render (or middleware), Prisma is called
3. Prisma cannot connect to PostgreSQL — throws
4. Next.js returns a 500 error page
5. `input[name="email"]` is never injected into the DOM
6. `page.fill` waits the full 30 s and times out

**Confirmed from source:**
- `middleware.ts` calls `prisma.user.findUnique` on every request to verify the session token — this alone causes all routes (including `/login`) to fail when the DB is down.
- Even if middleware is bypassed, `app/(app)/layout.tsx` calls `prisma.dataRun.findFirst` on every page within the app layout.

---

## Source Analysis (static — conducted in lieu of dynamic tests)

The spec was written against the actual source code. These findings represent expected behavior when the DB is available:

| Test | File | Expected Outcome |
|------|------|-----------------|
| H1 | `app/(app)/home/HomeClient.tsx` | No console errors expected; client-side fetches (`/api/brands`, `/api/auth/me`) return 200 when DB is up |
| H2 | `components/KPITile.tsx` | Tiles rendered with `.text-3xl` class; `kpiTile` records seeded for ONC-101 |
| H3 | `components/InsightRow.tsx` | InsightRow divs with `.cursor-pointer.rounded-2xl`; insights seeded for ONC-101 |
| H4 | `components/InsightRow.tsx:61` | `Link href={/insights/${insight.id}}` — View button navigates correctly |
| H5 | `app/(app)/home/HomeClient.tsx:343` | `action.map(ActionItem)` — actions seeded for ONC-101 |
| H6 | `app/(app)/layout.tsx:13` | `lastRunAt` dynamically formatted from `prisma.dataRun.findFirst`; not hardcoded |
| H7 | `app/(app)/home/HomeClient.tsx:205` | "Export Exec Pack" button present and visible |
| H8 | `app/(app)/home/HomeClient.tsx:218` | "Generate Pulse Brief" button present and visible |
| H9 | `components/layout/TopBar.tsx:56` | Brand dropdown defaults to `ONC-101` from FilterContext |
| H10 | `components/layout/NotificationPanel.tsx` | Bell button + Popover; "Notifications" heading appears on click |
| H11 | `components/layout/Sidebar.tsx:8-14` | Nav Links to `/home`, `/insights`, `/actions`, `/data-mapping`, `/settings` |

---

## Bugs Found

### BUG-H01 — All home page tests blocked by PostgreSQL unavailability (infrastructure, P0)

- **Priority:** P0
- **Area:** Infrastructure / Database
- **Tests affected:** H1–H11 (all 11 tests)
- **Expected:** PostgreSQL running; login succeeds; home page renders KPI tiles, insights, actions
- **Actual:** Login page returns "Internal Server Error"; `input[name="email"]` never appears; all tests time out at 30 s
- **Steps to reproduce:**
  1. Ensure PostgreSQL is not running (or is unreachable from the Next.js dev server)
  2. Navigate to `http://localhost:3002/login` in a browser
  3. Observe: page shows "Internal Server Error" instead of the login form
  4. Run: `npx playwright test testing/home.spec.ts --reporter=list`
  5. Observe: all 11 tests fail with `page.fill: Test timeout of 30000ms exceeded`
- **Root cause:** `middleware.ts` calls `prisma.user.findUnique` on every request; when PostgreSQL is down, this throws and Next.js returns a 500 before any page renders
- **Evidence:** `test-results/testing-home-H10-.../error-context.md` and `test-results/testing-home-H11-.../error-context.md` both show: `generic [ref=e2]: Internal Server Error`
- **Related prior bugs:** BUG-DM02, BUG-API01, BUG-AC01, BUG-S01, BUG-I01 — same root cause across all test suites
- **Fix:** Start PostgreSQL. Long-term: add a DB health-check middleware guard that returns a graceful 503 page instead of an unhandled 500

---

## Recommendations

1. **Start PostgreSQL** — All 11 home-page tests (and every other test suite on this platform) are blocked until PostgreSQL is running.
2. **Add a CI DB health gate** — Before running any Playwright tests, assert `pg_isready` or attempt a Prisma `$queryRaw SELECT 1` and fail-fast with a clear diagnostic instead of letting all tests time out.
3. **Graceful 503 page** — Middleware should catch Prisma connection errors and return a user-facing "Service temporarily unavailable" page instead of a raw 500.
4. **Re-run suite when DB is available** — Based on source analysis, all 11 tests are well-targeted and expected to pass once login succeeds. Spec file logic is sound.
5. **H6 note** — The hardcoded timestamp `"2026-03-05 06:10 ET"` is NOT present in the source (sidebar reads dynamically from `prisma.dataRun.findFirst`). H6 is expected to PASS when the DB is live.
