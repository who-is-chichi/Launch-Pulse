# Actions Page (Kanban + Impact Scorecards) — E2E Test Results

**Date:** 2026-03-20
**Runner:** Test Agent 4
**Tool:** Playwright 1.58.2 (Chromium)
**Base URL:** http://localhost:3002
**Dev server status:** DEGRADED — returning HTTP 500 "Internal Server Error" on all routes

---

## Pre-condition Assessment

| Check | Status | Detail |
|-------|--------|--------|
| Dev server responding on port 3002 | PARTIAL | Server is up (returns HTTP responses) but all routes return 500 |
| Login page renders form | FAIL | GET /login returns "Internal Server Error" — no HTML form rendered |
| Login flow | FAIL | `input[name="email"]` never appears (server returns 500, not login HTML) |
| DB connection (inferred) | DOWN | 500 on all routes including public /login implies PostgreSQL down or Prisma connection pool exhausted |

---

## Test Results

| Test | Description | Result | Notes |
|------|-------------|--------|-------|
| AC1 | Actions page loads with 4 Kanban columns: New, In Progress, Blocked, Done | BLOCKED | Server returns HTTP 500; login page never renders |
| AC2 | Each column shows a count badge (number next to column title) | BLOCKED | Server returns HTTP 500; login page never renders |
| AC3 | Action cards are visible with title text | BLOCKED | Server returns HTTP 500; login page never renders |
| AC4 | "Create Action Manually" button exists and clicking it opens modal with role="dialog" | BLOCKED | Server returns HTTP 500; login page never renders |
| AC5 | Create Action modal: submit empty form → modal stays open (HTML5 validation) | BLOCKED | Server returns HTTP 500; login page never renders |
| AC6 | Create Action modal: fill Title, Linked Insight, Owner, Due Date, Severity → submit → new card in "New" column | BLOCKED | Server returns HTTP 500; login page never renders |
| AC7 | Move action: hover card in "New" → move button → click "→ In Progress" → card moves | BLOCKED | Server returns HTTP 500; login page never renders |
| AC8 | "Impact Scorecards" tab exists and clicking it changes the view | BLOCKED | Server returns HTTP 500; login page never renders |
| AC9 | Actions page persists after reload (cards still present) | BLOCKED | Server returns HTTP 500; login page never renders |

**Summary: 0 passed, 0 failed on assertions, 9 BLOCKED (infrastructure failure — HTTP 500 on all routes)**

---

## Failure Details

### Error: Playwright test run — all 9 tests

- **Command:** `npx playwright test testing/actions.spec.ts --reporter=list`
- **Result:** All 9 tests timed out at `page.fill('input[name="email"]', ...)` in the `beforeEach` login hook
- **Timeout:** 30000ms
- **Root cause:** The dev server on port 3002 returns HTTP 500 "Internal Server Error" on the `/login` route. The login page renders as a generic error page with no form elements. Playwright's `page.fill('input[name="email"]', ...)` never resolves because the input does not exist in the DOM.
- **Evidence from error-context.md:** Page snapshot shows `- generic [ref=e2]: Internal Server Error` — confirming the server returned a 500 error page instead of the login form.

---

## Source Code Analysis (Static — confirmed from `app/(app)/actions/ActionsClient.tsx`)

Live testing was blocked by the infrastructure failure. Static analysis confirms the following implementation details:

### Kanban Board (AC1, AC2, AC3)
- **4 columns confirmed in source:** `new`, `inprogress`, `blocked`, `done` (columnConfig array, lines 38–43 of ActionsClient.tsx)
- **Column labels in DOM:** "New", "In Progress", "Blocked", "Done" (h3 elements)
- **Column count badge:** Each column header renders a `<Badge>` containing `{cards.length}` (a plain number). Selector: `h3 + span` or Badge component.
- **Action cards:** Each seeded action renders an h4 with the action title text.

### Seeded Actions (from `prisma/seed.ts`)
- "Deep-dive SP 'Pending Outreach' backlog with hub partner" — status: `inprogress`, severity: High
- "Review T12 call plans and Account prioritization with RSD" — status: `new`, severity: High
- "Validate Northeast parent system drops are not data artifacts" — status: `done`, severity: Medium
- "Hub partner meeting — waiting on scheduling from Midwest SP" — status: `blocked`, severity: Low
- "Coaching session with 6 reps below 60% compliance threshold" — status: `new`, severity: High
- "Backfill T12 territory vacancy with interim rep coverage" — status: `inprogress`, severity: Medium
- "Implemented improved SP triage process" — status: `done` (with impactScore, outcome: Partial)
- "Updated call targeting for high-value accounts" — status: `done` (with impactScore, outcome: Yes)

### Create Action Modal (AC4, AC5, AC6)
- Button text: "Create Action Manually" (exact match, line 300)
- Modal: `<div role="dialog" aria-modal="true" aria-labelledby="create-manual-action-title">` — correct role attribute present (AC4 assertion would pass)
- Required fields with `required` attribute: Title, Linked Insight, Owner, Due Date (AC5 — HTML5 validation prevents empty submit)
- Severity is a `<select>` pre-set to "Medium" — not required to change
- Submit button: `<Button type="submit">Create Action</Button>`
- On success: action prepended to local state, modal closed → new card appears in New column (AC6)
- API: `POST /api/actions` with `{ brandCode, title, linkedInsight, owner, dueDate, severity, ... }`

### Move Action (AC7)
- Move buttons hidden by default via `hidden group-hover:flex` CSS class
- Hover reveals buttons for all OTHER statuses: "→ New", "→ In Progress", "→ Blocked", "→ Done"
- Moving to `done` status triggers an Impact Score modal (optional, can be skipped)
- Moving to any other status: immediate optimistic state update + `PATCH /api/actions/:id`

### Impact Scorecards Tab (AC8)
- Tab text: "Impact Scorecards" (`<TabsTrigger value="impact">Impact Scorecards</TabsTrigger>`)
- After click: tab `data-state="active"` changes; Kanban board hides; scorecard list renders
- Empty state: "No completed actions with impact scores yet."
- Seeded data includes 2 scorecards (outcome: Partial, outcome: Yes)

---

## Bugs Found

### BUG-AC-P0-01 — Dev server returns HTTP 500 on all routes

- **Priority:** P0 (test blocker)
- **Area:** Infrastructure / PostgreSQL / Prisma
- **Tests blocked:** AC1 through AC9 (all 9 tests)
- **Expected:** Dev server at `http://localhost:3002` responds correctly; GET `/login` returns 200 with HTML login form
- **Actual:** All routes — including the public `/login` page — return "Internal Server Error" (HTTP 500)
- **Evidence:** Playwright error-context.md shows `- generic [ref=e2]: Internal Server Error` as entire page content
- **Root cause hypothesis:** PostgreSQL process is down or the Prisma connection pool is exhausted. The Next.js middleware performs `prisma.user.findUnique()` on every request. If the DB is unreachable, the middleware throws, causing a 500. Even public routes like `/login` fail because the login API (`POST /api/auth/login`) also calls Prisma.
- **Remediation:**
  1. Check PostgreSQL process: `docker ps` or `pg_isready`
  2. Restart DB container if needed: `docker compose up -d db`
  3. Restart Next.js dev server after DB is confirmed healthy
  4. Consider adding a DB health check to the middleware that gracefully handles DB unavailability without returning 500 on public routes

---

## Notes

- This is the second run of this test agent. The first run (documented in this same file from a previous session) experienced the same HTTP 500 infrastructure failure at port 3000.
- The current run is at port 3002 and encounters the same issue.
- Both runs were blocked by the same P0 DB connectivity issue — not by application logic bugs.
- Static analysis of the source code suggests the Kanban page implementation is correctly structured and the test assertions (AC1–AC9) would likely pass once the server is healthy.
- One potential issue to watch: the modal uses a custom overlay `div` (not a native `<dialog>`), though it does have `role="dialog"` set — so AC4's assertion `page.getByRole('dialog')` should work correctly.
