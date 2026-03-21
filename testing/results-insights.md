# Insights List & Detail — E2E Test Results

**Date:** 2026-03-20
**Runner:** Test Agent 3
**Tool:** Playwright 1.58.2 (Chromium)
**Base URL:** http://localhost:3000
**Dev server status:** Running (HTTP 307 — redirects to /login as expected)

---

## Pre-condition Check

| Check | Result | Detail |
|-------|--------|--------|
| Dev server running | PASS | HTTP 307 |
| Database (PostgreSQL) | FAIL | Not running — `POST /api/auth/login` returns HTTP 500; all authenticated tests blocked |

---

## Test Results

| Test | Description | Result | Notes |
|------|-------------|--------|-------|
| I1 | Insights page loads with rows | BLOCKED | Login fails: DB unavailable → POST /api/auth/login HTTP 500 → waitForURL(/home/) times out at 15 s; test times out at 45 s |
| I2 | Table has expected columns (headline, pillar, severity, impact, region, status) | BLOCKED | Same root cause: DB unavailable |
| I3 | Pillar filter works | BLOCKED | Same root cause; however code analysis shows pillar filter uses Radix UI Select (role="combobox"), not a native select — filter locator `select, [role="combobox"]` would match correctly if DB was running |
| I4 | Export button disabled when nothing selected | BLOCKED | Same root cause; code confirms: `disabled={selectedIds.size === 0}` → button correctly disabled initially |
| I5 | Row checkbox enables export button | BLOCKED | Same root cause; code confirms: button text is `Export (N)` when N>0 — test regex `export\s*\(\s*1\s*\)\|export selected` would match |
| I6 | Export downloads CSV | BLOCKED | Same root cause; code confirms: `exportInsightsToCsv()` creates blob and triggers `a.click()` with filename `insights-export-YYYY-MM-DD.csv` — Playwright download event should fire; test regex `/insights.*\.csv/i` would match |
| I7 | Select-all checkbox selects all rows | BLOCKED | Same root cause; code confirms: header checkbox sets all IDs in `filteredInsights` |
| I8 | Headline link navigates to detail | BLOCKED | Same root cause; code confirms: each row has `<Link href="/insights/${insight.id}">` which renders as an `<a>` tag — test selector `table tbody tr a` would match |
| I9 | Detail page loads with headline | BLOCKED | Same root cause |
| I10 | Back button returns to insights list | BLOCKED | Same root cause; code note: back button is a `<Link href="/insights">` wrapping a `<Button>` with `<ArrowLeft>` icon — clicking the outer button/link triggers navigation to /insights, not via browser history |
| I11 | Status dropdown is visible and changeable | BLOCKED | Same root cause; code confirms: status is a native `<select>` with values New/Investigating/Actioned/Monitoring — test locator `select` with text filter would match |
| I12 | Share button shows toast | BLOCKED | Same root cause; code confirms: Share button fires `toast.success('Link copied')` — page body would contain "Link copied"; test regex `copied\|link\|share` would match |
| I13 | Notes textarea and save button work | BLOCKED | Same root cause; code confirms: textarea present, "Save Notes" button calls PATCH `/api/insights/:id`, shows `toast.success('Notes saved')` on success; test regex `saved\|notes` would match |
| I14 | Create action modal opens | BLOCKED | Same root cause; **ADDITIONAL BUG (see below)**: modal div has no `role="dialog"` attribute and no CSS class containing "modal" or "dialog" — test assertion `modal.isVisible()` would return false even if DB was running |

**Summary: 0 passed, 14 blocked (database unavailable)**

---

## Failure Details

### All tests — Login blocked by database unavailability

**Root cause:** PostgreSQL at `localhost:5432` is not running. Every call to `POST /api/auth/login` hits Prisma's `user.findUnique()`, which throws a connection error, causing a 500 response. No session cookie is issued. The login page's `window.location.href = '/home'` is never executed. `waitForURL(/home/, { timeout: 15000 })` times out in the `login()` helper, cascading to a 45 s overall test timeout.

**Expected:** All 14 tests complete with login succeeding and insights pages rendered.

**Actual:** All 14 tests time out at 45 s (`Test timeout of 45000ms exceeded`). Playwright output shows `x 1..14` on first run at 24–25 s each (25 s = 15 s login timeout + ~10 s test overhead), then 45 s on second run after timeouts extended.

**Related bugs from prior test agents:** BUG-DM02, BUG-API01, BUG-AC01, BUG-S01 — identical infrastructure root cause.

---

### I14 — Create action modal not detectable by Playwright selector (code defect)

**Identified via:** Source code inspection of `app/(app)/insights/[id]/InsightDetailClient.tsx` lines 487–604.

**Root cause:** The "Create Action Item" modal is implemented as a plain `<div className="fixed inset-0 z-50 flex items-center justify-center">`. The inner panel is `<div className="relative bg-white rounded-2xl border ...">`. Neither element has `role="dialog"`, `role="alertdialog"`, or a CSS class name containing "modal" or "dialog".

The test assertion:
```
const modal = page.locator('[role="dialog"], [class*="modal"], [class*="dialog"]');
const modalVisible = await modal.isVisible().catch(() => false);
expect(modalVisible).toBe(true);
```

This locator will match zero elements and `isVisible()` will return false, causing the test to fail even when the DB is running and the modal is visually open.

**Expected:** After clicking "Create Action Item", a dialog element with `role="dialog"` or a detectable class is visible.
**Actual:** Modal markup has no accessible role and no class name that matches the test locator.

---

## BUGS

### BUG-I01 — All Insights tests blocked by database unavailability

- **Priority:** P0
- **Area:** Infrastructure / Insights
- **Test:** I1–I14 — all BLOCKED
- **Expected:** PostgreSQL is running; tests can log in and exercise the /insights and /insights/:id pages
- **Actual:** PostgreSQL at `localhost:5432` is not running; all Prisma calls throw; POST /api/auth/login returns HTTP 500; waitForURL(/home/) times out; all 14 tests timeout at 45 s
- **Steps to reproduce:**
  1. Stop PostgreSQL
  2. Run `npx playwright test testing/insights.spec.ts`
  3. Observe: all 14 tests timeout at 45 s — "Test timeout of 45000ms exceeded"
- **Related:** BUG-DM02, BUG-API01, BUG-AC01, BUG-S01

### BUG-I02 — Create action modal has no accessible role or detectable class

- **Priority:** P2
- **Area:** Insights / Accessibility
- **Test:** I14 — create action modal opens
- **Expected:** The "Create Action Item" modal renders with `role="dialog"` so it is (a) accessible to screen readers and (b) detectable by standard Playwright/testing selectors
- **Actual:** Modal outer div is `<div className="fixed inset-0 z-50 ...">` and inner panel is `<div className="relative bg-white rounded-2xl ...">` — neither has `role="dialog"`, `aria-modal`, `aria-labelledby`, or a class containing "modal" or "dialog". Playwright locator `[role="dialog"], [class*="modal"], [class*="dialog"]` will match 0 elements.
- **Steps to reproduce:**
  1. Start DB, log in, navigate to any insight detail page
  2. Click "Create Action Item" button
  3. Open browser DevTools and inspect the modal DOM
  4. Observe: no `role="dialog"` attribute on any modal element
  5. Run test I14 — `expect(modalVisible).toBe(true)` fails
- **Code reference:** `app/(app)/insights/[id]/InsightDetailClient.tsx` line 488 — `<div className="fixed inset-0 z-50 flex items-center justify-center">`
- **Fix:** Add `role="dialog"` and `aria-modal="true"` to the inner modal panel div.

---

## Source Code Analysis (for when DB is restored)

These tests are expected to pass once the database is running, based on source code review:

| Test | Expected outcome | Confidence |
|------|-----------------|------------|
| I1 | PASS | HIGH — table renders with `filteredInsights.map()` |
| I2 | PASS | HIGH — columns Headline/Pillar/Severity/Impact/Region/Date/Status all in thead |
| I3 | PASS/SKIP | MEDIUM — Radix Select used; filter locator should find combobox; interaction depends on Radix dropdown behavior |
| I4 | PASS | HIGH — `disabled={selectedIds.size === 0}` confirmed in code |
| I5 | PASS | HIGH — button text `Export (${selectedIds.size})` confirmed; regex matches |
| I6 | PASS | HIGH — `a.download = 'insights-export-YYYY-MM-DD.csv'`; Playwright handles blob downloads |
| I7 | PASS | HIGH — header checkbox sets `new Set(filteredInsights.map(i => i.id))` |
| I8 | PASS | HIGH — `<Link href="/insights/${insight.id}">` in each row |
| I9 | PASS | HIGH — detail page renders pillar, severity, impact, confidence metadata |
| I10 | PASS | HIGH — `<Link href="/insights">` wrapping Button is at top of page |
| I11 | PASS | HIGH — native `<select>` with New/Investigating/Actioned/Monitoring options |
| I12 | PASS | HIGH — `toast.success('Link copied')` fires on Share button click |
| I13 | PASS | HIGH — textarea + "Save Notes" button + `toast.success('Notes saved')` confirmed |
| I14 | FAIL | HIGH — modal has no `role="dialog"` (BUG-I02); test assertion will fail |
