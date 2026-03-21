# Data Mapping UI — E2E Test Results

**Date:** 2026-03-20
**Runner:** Test Agent 6 (re-run at port 3002)
**Tool:** Playwright 1.58.2 (Chromium)
**Base URL:** http://localhost:3002
**Dev server status:** Running — HTTP responses received, but PostgreSQL unavailable

---

## Summary

**0 passed, 7 failed — all BLOCKED by infrastructure failure (PostgreSQL unavailable)**

All DM1–DM7 tests require authenticated browser sessions. Login (`POST /api/auth/login`) returns HTTP 500 because the PostgreSQL database at `localhost:5432` is unreachable and Prisma `user.findUnique()` throws an unhandled connection error. No session cookie is issued, so the middleware redirects every subsequent navigation back to `/login`. The login page input never becomes interactive within the 30 s timeout.

---

## Test Results

| Test | Description | Result | Actual Behavior | Notes |
|------|-------------|--------|-----------------|-------|
| DM1 | Page loads with "Latest Drop Status" tab active | FAIL | `page.fill('input[name="email"]')` timed out at 30 s — login page never rendered | DB down, login returns 500 |
| DM2 | Datasets table shows ≥1 row | FAIL | Same timeout in login helper | DB down |
| DM3 | Freshness badges visible (Fresh/Lag/Stale) | FAIL | Same timeout in login helper | DB down |
| DM4 | "Mapping Configurations" tab exists and changes view | FAIL | Same timeout in login helper | DB down |
| DM5 | Edit button opens modal with `role="dialog"` | FAIL | Same timeout in login helper | DB down |
| DM6 | Normalization Rules tab exists and shows content | FAIL | Same timeout in login helper | DB down |
| DM7 | Upload Mapping button opens wizard with `role="dialog"` | FAIL | Same timeout in login helper | DB down |

**Summary: 0 passed, 7 failed**

---

## Static Analysis (source code — conducted without DB)

The `/data-mapping` page is fully implemented. Based on source code inspection, the following expectations about the tests when DB is restored:

| Test | Static Finding | Expected Result (DB online) |
|------|---------------|----------------------------|
| DM1 | `DataMappingClient.tsx` line 94: `const [activeTab, setActiveTab] = useState('status')`. TabsTrigger `value="status"` maps to "Latest Drop Status". Radix UI sets `data-state="active"` on the active tab. | PASS |
| DM2 | Datasets table rendered in `TabsContent value="status"`. Seed data (`prisma/seed.ts`) provides datasets for ONC-101. | PASS (if seed ran) |
| DM3 | `FreshnessBadge` component (line 73–84) renders a `<Badge>` with text `Fresh`, `Lag`, or `Stale`. | PASS |
| DM4 | TabsTrigger `value="mappings"` renders "Mapping Configurations". Click sets `data-state="active"` and shows `TabsContent value="mappings"`. | PASS |
| DM5 | Edit button on config card calls `openEdit(config)` → sets `editingConfig` state → renders `<div role="dialog">` (line 446). | PASS |
| DM6 | TabsTrigger `value="normalization"` renders "Normalization Rules". Content includes "SP Status Value Mapping" heading. | PASS |
| DM7 | "Upload Mapping" header button calls `setWizardOpen(true)` (line 159). `UploadMappingWizard` renders with `role="dialog"`. | PASS (need to verify wizard has `role="dialog"` attribute) |

---

## Failure Details

### All DM1–DM7 — Login blocked by DB unavailability

**Error logged by Playwright:**
```
Test timeout of 30000ms exceeded.
Error: page.fill: Test timeout of 30000ms exceeded.
  - waiting for locator('input[name="email"]')
```

**Root cause:** `POST /api/auth/login` → Prisma `user.findUnique()` → connection refused at `localhost:5432` → 500 Internal Server Error. No `Set-Cookie` header on 500 response → middleware redirects all subsequent requests to `/login` → login page itself hangs or returns 500 during SSR → `input[name="email"]` never becomes visible within test timeout.

**Code path:**
- `app/api/auth/login/route.ts` line 42: `const user = await prisma.user.findUnique(...)` — throws when DB is down
- `middleware.ts` lines 35–45: DB call inside `try/catch` — catch block redirects to `/login`, but middleware itself can throw on the DB call if Prisma client initialization fails

---

## Bugs Found

### BUG-DM-INFRA — All DM tests blocked by database unavailability (P0)

- **Priority:** P0
- **Area:** Infrastructure / Data Mapping
- **Test:** DM1–DM7 — all BLOCKED
- **Expected:** Dev server login succeeds, browser navigates to `/data-mapping`, UI renders with tabs, datasets, freshness badges, and upload wizard
- **Actual:** PostgreSQL at `localhost:5432` is not running; login API returns HTTP 500; no session cookie issued; all browser tests timeout after 30 s
- **Steps to reproduce:**
  1. Ensure PostgreSQL is not running (Docker container stopped)
  2. Run `npx playwright test testing/datamapping-api.spec.ts`
  3. Observe: all DM tests fail with `page.fill: Test timeout of 30000ms exceeded`
- **Fix:** Run `docker compose up -d postgres` (or equivalent) to start PostgreSQL

### BUG-DM-WIZARD-ROLE — UploadMappingWizard `role="dialog"` not verified (P2, needs re-test)

- **Priority:** P2 (needs verification when DB is online)
- **Area:** Data Mapping / Upload Wizard
- **Test:** DM7
- **Note:** `UploadMappingWizard.tsx` is a multi-step wizard component. The outer container may or may not have `role="dialog"`. Source inspection was inconclusive (component is >500 lines). Needs live test to confirm.

---

## Re-test Checklist (when DB is online)

- [ ] DM1: Confirm "Latest Drop Status" tab has `data-state="active"` on page load
- [ ] DM2: Confirm datasets table has ≥1 row
- [ ] DM3: Confirm at least one freshness badge with text Fresh/Lag/Stale is visible
- [ ] DM4: Click "Mapping Configurations" tab — confirm view changes
- [ ] DM5: Click Edit button on config — confirm modal with `role="dialog"` appears
- [ ] DM6: Click "Normalization Rules" tab — confirm "SP Status Value Mapping" heading visible
- [ ] DM7: Click "Upload Mapping" button — confirm wizard/panel with `role="dialog"` appears
