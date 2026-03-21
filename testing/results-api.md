# API Multi-Tenancy & Edge Cases — E2E Test Results

**Date:** 2026-03-20
**Runner:** Test Agent 6 (re-run at port 3002)
**Tool:** Playwright 1.58.2 `request` API (no browser)
**Base URL:** http://localhost:3002
**Dev server status:** Running — all DB-touching routes return 500 (PostgreSQL unavailable)

---

## Pre-conditions

| Check | Result | Detail |
|-------|--------|--------|
| Dev server running | PASS | HTTP responses received within timeout |
| Login API (`POST /api/auth/login`) | FAIL | HTTP 500 — Prisma `user.findUnique()` throws (DB unavailable) |
| Session token acquired | FAIL | No `Set-Cookie` header on 500 response; cookie value is `""` |
| PostgreSQL DB | FAIL | `localhost:5432` not reachable — all Prisma routes return 500 |

---

## Test Results

| Test | Description | Result | HTTP Status Received | Expected | Notes |
|------|-------------|--------|----------------------|----------|-------|
| API-1 | `GET /api/brands` with session → 200 + ONC-101 | FAIL | Login returned 500; no session cookie extracted (`expect("").toBeTruthy()` failed) | 200 `{"brands":[...]}` | DB down; login cannot issue session |
| API-2 | `GET /api/insights?brand=ONC-101` with session → 200 | FAIL | 500 | 200 `{"insights":[...]}` | No valid session; DB down causes 500 |
| API-3 | `GET /api/insights` WITHOUT session → NOT 200 | PASS | 500 | 302/401/403 | Status is not 200 — no insight data exposed. 500 due to DB-down middleware crash |
| API-4 | `GET /api/insights?brand=FAKE-999` → 404 | FAIL | 500 | 404 | Should return 404 for unknown brand; returns 500 when DB is down |
| API-5 | Forged JWT cookie → NOT 200 with data | PASS | 500 | 302/401/403 | Forged token rejected — no insight data returned. 500 due to DB crash |
| API-6 | `GET /api/actions?brand=ONC-101&pageSize=1` → 200 with pagination | FAIL | 500 | 200 `{"pagination":{...}}` | No valid session; DB down |
| API-7 | `POST /api/actions` missing `title` → 400 | FAIL | 500 | 400 | Session empty → middleware redirects, or session present but DB down causes 500 before validation runs |
| API-8 | `PATCH /api/insights/[id]` invalid status → 400 | FAIL | Step failed: insights fetch returned 500, could not get insight ID | 400 | Blocked by same DB issue |
| API-9 | `GET /api/export/exec-pack?brand=ONC-101` → 200 text/html | FAIL | Blocked: `insightsRes.json()` threw `SyntaxError` (500 response body is not JSON) | 200 `text/html` | DB down |

**Summary: 2 passed, 7 failed**

---

## Security Test Results (Critical Findings)

### API-3 — Unauthenticated access (no cookie)
- **Result: PASS (security behavior correct)**
- `GET /api/insights?brand=ONC-101` without any session cookie returned HTTP 500 (not 200)
- No insight data was exposed in the response body
- The 500 is due to the DB being unavailable causing the middleware to crash rather than redirect cleanly, but the security outcome (access denied, no data) is correct
- When DB is online: middleware redirects to `/login` (302) — clean access denial

### API-5 — Forged JWT cross-tenant access
- **Result: PASS (security behavior correct)**
- Forged JWT (`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmYWtlIiwiaWF0IjoxNjAwMDAwMDAwfQ.fakesignature`) returned HTTP 500
- No insight data was returned; access was denied
- `verifyToken()` in `lib/auth.ts` uses `jose` `jwtVerify` which verifies the HMAC-SHA256 signature against `JWT_SECRET`. An invalid signature causes `jwtVerify` to throw, `verifyToken` returns `null`, and middleware redirects to `/login`
- When DB is online, this test should verify explicitly that a 302/401 is returned (not 500) and no data is exposed

---

## Failure Details

### P0 — Database Unavailable (affects all authenticated tests)

**Root cause:** PostgreSQL at `postgresql://postgres:admin@localhost:5432/commercial_insights` is not reachable. All Prisma operations throw a connection error:
- `POST /api/auth/login` → HTTP 500 (no session cookie issued)
- `GET /api/brands` → HTTP 500
- `GET /api/insights?brand=ONC-101` → HTTP 500
- `GET /api/actions?brand=ONC-101` → HTTP 500
- `GET /api/export/exec-pack?brand=ONC-101` → HTTP 500

**Evidence from test run:**
```
API-1: expect("").toBeTruthy() — received ""
  (getSessionCookie extracted empty string because login returned 500 with no Set-Cookie header)

API-2: expect(res.status()).toBe(200) — Expected: 200, Received: 500

API-4: expect(res.status()).toBe(404) — Expected: 404, Received: 500

API-6: expect(res.status()).toBe(200) — Expected: 200, Received: 500

API-7: expect(res.status()).toBe(400) — Expected: 400, Received: 500

API-8: expect(insightsRes.status()).toBe(200) — Expected: 200, Received: 500
  (could not retrieve insight ID to use in PATCH request)

API-9: SyntaxError: Unexpected token 'I', "Internal S"... is not valid JSON
  (tried to parse 500 "Internal Server Error" text as JSON)
```

**Fix:** Start PostgreSQL: `docker compose up -d postgres`

---

### API-4 — FAKE brand returns 500 instead of 404 (when DB is down)

**Root cause:** `assertBrandAccess()` in `lib/request-context.ts` calls `prisma.brand.findUnique()`. When DB is unavailable, Prisma throws a connection error. The outer catch in `app/api/insights/route.ts` catches all errors and returns 500.

**Expected:** HTTP 404 (brand not found — `assertBrandAccess` throws `{ status: 404 }` for unknown brands)
**Actual:** HTTP 500 (DB connection error)
**Note:** When DB is online, this should correctly return 404. The 404 logic exists in `assertBrandAccess`. Re-test when DB is available.

---

### API-7 — POST /api/actions validation ordering (P2 — needs re-verification)

**Observation:** `app/api/actions/route.ts` line 44 calls `validateActionBody(body)` BEFORE `getOrgId()` or any Prisma call. This means a request missing `title` should return 400 without hitting the DB.

**However**, during testing without a valid session, our session cookie was `""` (empty string). With an empty session cookie, middleware intercepts the request before the route handler runs:
- If session value is falsy → middleware redirects to `/login` (302)
- Playwright `request` API follows redirects by default → ends up at login page (200 HTML)
- But actual result was 500, suggesting middleware itself crashed due to DB unavailability

**Conclusion:** When DB is online, API-7 should return 400 because `validateActionBody` runs before auth. The validation logic in `lib/actions-validation.ts` correctly checks for missing `title` and returns `"title is required"`. This is likely a P0-infra-blocked test, not a real application bug.

**Re-test when DB is online with a valid session to confirm.**

---

## Source Code Findings (static analysis)

| Finding | File | Assessment |
|---------|------|------------|
| Validation runs before auth in POST /api/actions | `app/api/actions/route.ts` lines 43–45 | GOOD: input validation fires before DB calls; missing title returns 400 without hitting DB |
| PATCH /api/insights/[id] validates status before DB | `app/api/insights/[id]/route.ts` lines 62–64 | GOOD: invalid status checked first, returns 400 |
| Middleware fail-closed on DB error | `middleware.ts` lines 36–45 | GOOD: DB unreachable → redirect to login (deny access), but 500 observed suggests middleware itself crashes when Prisma client can't initialize |
| Cookie extraction regex | `testing/datamapping-api.spec.ts` `getSessionCookie` | Session extracted via `set-cookie.match(/session=([^;]+)/)` — correct pattern for standard Set-Cookie header |
| Exec-pack returns text/html | `app/api/export/exec-pack/route.ts` line 303–309 | Correct: `Content-Type: text/html; charset=utf-8` on success |
| Brands API requires orgId from session | `app/api/brands/route.ts` line 9 | Multi-tenancy correct: `getOrgId(request)` reads from `x-org-id` header injected by middleware; no cross-org data leakage possible |

---

## Bugs Found

### BUG-API-INFRA — All authenticated API endpoints return 500 (P0)
- **Priority:** P0
- **Area:** Infrastructure
- **Test:** API-1, API-2, API-4, API-6, API-7, API-8, API-9
- **Expected:** API routes return appropriate responses (200, 400, 404) after authentication
- **Actual:** HTTP 500 — PostgreSQL at `localhost:5432` not accepting connections
- **Fix:** `docker compose up -d postgres`

### BUG-API-MIDDLEWARE-500 — Middleware returns 500 instead of 302 when DB is down (P1)
- **Priority:** P1
- **Area:** Middleware / Infrastructure
- **Test:** API-3, API-5 (security tests passed only because 500 ≠ 200)
- **Expected:** When DB is unreachable during middleware DB check, middleware should return a 503 or 302/401 response — not crash with 500
- **Actual:** Middleware catches Prisma errors (lines 41–45) and should redirect to `/login`. But tests show 500 responses for routes that should get a redirect. This suggests middleware initialization or Prisma client initialization may fail before the try/catch runs, producing an unhandled 500.
- **Code:** `middleware.ts` lines 36–45 — catch block exists but may not catch all failure modes
- **Security impact:** 500 still denies access (no data exposed), but it's not the correct HTTP semantic

### BUG-API-07-RETEST — POST /api/actions validation ordering needs re-verification (P2)
- **Priority:** P2 (needs re-verification with DB online)
- **Area:** API / Input Validation
- **Test:** API-7
- **Expected:** POST without `title` returns 400 before auth (validation runs first)
- **Actual:** 500 (DB down, root cause unclear — could be infra or ordering issue)
- **Static analysis:** Validation IS first in the route handler, so 400 should work when DB is online
- **Action:** Re-run API-7 with a valid session and DB online to confirm 400 is returned

---

## Re-test Checklist (when DB is online)

- [ ] API-1: `GET /api/brands` with valid session → should return 200 with `brands` array containing ONC-101
- [ ] API-2: `GET /api/insights?brand=ONC-101` → should return 200 with `insights` array
- [ ] API-3: Unauthenticated → should return 302 redirect (not 500)
- [ ] API-4: `GET /api/insights?brand=FAKE-999` → should return 404 (not 500)
- [ ] API-5: Forged JWT → should return 302/401 (not 500); confirm `verifyToken` rejects invalid signature
- [ ] API-6: `GET /api/actions?pageSize=1` → should return 200 with `pagination` object containing `pageSize: 1`
- [ ] API-7: `POST /api/actions` missing `title` (with valid session) → should return 400 `{"error":"title is required"}`
- [ ] API-8: `PATCH /api/insights/:id` with `{"status":"INVALID_STATUS_XYZ"}` → should return 400
- [ ] API-9: `GET /api/export/exec-pack?brand=ONC-101` → should return 200 with `Content-Type: text/html`
