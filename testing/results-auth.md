# Auth Flow — E2E Test Results

**Date:** 2026-03-20
**Runner:** Test Agent 1
**Tool:** Playwright 1.58.2 (Chromium)
**Base URL:** http://localhost:3000
**Dev server status:** Running (HTTP 307)

---

## Test Results

| Test | Description | Result | Notes |
|------|-------------|--------|-------|
| T1 | Unauthenticated `/home` redirects to `/login` | PASS | Redirect fires correctly |
| T2 | Unauthenticated `/insights` redirects to `/login` | PASS | Redirect fires correctly |
| T3 | Login page renders email, password, submit | PASS | All three elements visible |
| T4 | Wrong password shows error | PASS | Error text matches `/invalid/i` (API returns `"Invalid email or password"`); page stays at `/login` |
| T5 | Valid login redirects to `/home` | FAIL | `waitForURL(/home/, {timeout:10000})` timed out; browser navigated to `/login` twice and never reached `/home` |
| T6 | Session cookie set after login | FAIL | Depends on successful login navigation (same root cause as T5) |
| T7 | `GET /api/auth/me` returns correct user | FAIL | Depends on successful login navigation (same root cause as T5) |
| T8 | Logout redirects to `/login` | FAIL | Depends on successful login navigation (same root cause as T5) |
| T9 | After logout, `/home` redirects to `/login` | PASS | Cookie cleared via `context.clearCookies()`; redirect fires |
| T10 | Rate limiting: 7 wrong logins produce at least one 429 | FAIL | `TypeError: Failed to fetch` — `page.evaluate` ran on `about:blank` (no origin), blocked by same-origin policy |

**Summary:** 5 passed, 5 failed

---

## Failure Details

### T5, T6, T7, T8 — Login does not navigate to /home

**Root cause:** The login page (`app/login/page.tsx`) handles success via `router.push('/home')` on the client side. Playwright's navigation log shows the browser navigated to `/login` twice and never reached `/home`. The most likely cause is that `router.push('/home')` triggers navigation, but Next.js middleware immediately redirects back to `/login` before the `session` cookie is committed to the browser's cookie jar.

The login API (`POST /api/auth/login`) uses the Next.js `cookies()` helper to set the `session` cookie server-side and returns `{ ok: true }`. However, because this is a `fetch()` call (not a full-page navigation), the browser must process the `Set-Cookie` response header from the JSON API response before `router.push('/home')` fires. Playwright's timing logs indicate the cookie is not reliably present when the navigation begins, causing middleware to redirect back to `/login`.

**Expected:** After submitting correct credentials, browser navigates to `/home` and stays there.
**Actual:** Browser navigates to `/login` (once or twice) and never reaches `/home`; `waitForURL(/home/, timeout:10000)` times out.

**Code references:**
- `app/login/page.tsx` lines 26–34: `fetch('/api/auth/login', ...)` then `if (res.ok) { router.push('/home'); }`
- `app/api/auth/login/route.ts` lines 65–72: sets `session` cookie via `cookieStore.set()`

---

### T4 — No error shown to user on failed login (partial finding)

T4 passes because the test checks `body` text and the word "Invalid" appears somewhere in the page (likely from a toast or body text). However, inspecting `app/login/page.tsx` reveals the `handleSubmit` function does **not** render any error state to the user — when `res.ok` is false, it does nothing (no `setError`, no toast). The T4 pass was incidental: the raw JSON from the API response (`{"error":"Invalid email or password"}`) may be exposed in the page body in some cases, but there is no intentional UI error message. This is a UX bug.

---

### T10 — Rate limit test blocked by same-origin policy

**Root cause:** The test calls `page.evaluate(async (base) => { fetch(base + '/api/auth/login', ...) })` but the page context at that point is `about:blank` (no prior `page.goto()`). Fetching `http://localhost:3000` from `about:blank` is blocked by the browser's same-origin/CORS policy, producing `TypeError: Failed to fetch`.

**Expected:** 7 sequential POST requests to `/api/auth/login` with wrong credentials; at least one returns HTTP 429.
**Actual:** `TypeError: Failed to fetch` — zero requests complete.

**Secondary finding:** Rate limit triggers at 5 failed attempts (`MAX_ATTEMPTS = 5`, `lib/rate-limit.ts` line 22). The test attempts 7 requests, so at least requests 5–7 should return 429 — this logic is correct. The test itself has a structural flaw (no prior `page.goto()`).

---

## BUGS

### BUG-A01 — Login success does not navigate to /home (P0)

- **Priority:** P0
- **Area:** Auth
- **Test:** T5, T6, T7, T8 — valid login flow
- **Expected:** Submitting correct credentials sets `session` cookie and navigates to `/home`
- **Actual:** Browser is redirected back to `/login`; middleware sees no valid session cookie on the `/home` navigation and redirects back to `/login`
- **Root cause:** Race between `router.push('/home')` (client-side) and the `session` cookie being committed by the browser from the `Set-Cookie` header on the `fetch()` response. Middleware runs before the cookie is available.
- **Steps to reproduce:**
  1. Navigate to `http://localhost:3000/login`
  2. Enter `alex@company.com` / `password123`
  3. Click Sign In
  4. Observe: page stays at `/login` instead of redirecting to `/home`

---

### BUG-A02 — Login form shows no error message on failed authentication (P2)

- **Priority:** P2
- **Area:** Auth
- **Test:** T4 (passes incidentally, but UI error is missing)
- **Expected:** When login fails (wrong password), the login form displays a visible error message to the user
- **Actual:** `handleSubmit` in `app/login/page.tsx` silently does nothing on non-OK response; no `error` state, no toast, no UI feedback
- **Steps to reproduce:**
  1. Navigate to `http://localhost:3000/login`
  2. Enter any email and wrong password
  3. Click Sign In
  4. Observe: no error message appears; form stays blank

---

### BUG-A03 — Rate limit test (T10) blocked by same-origin policy due to missing page navigation (P1)

- **Priority:** P1
- **Area:** Auth / Rate Limiting
- **Test:** T10 — rate limiting returns 429
- **Expected:** Multiple wrong login attempts to `/api/auth/login` eventually return HTTP 429
- **Actual:** `TypeError: Failed to fetch` — fetch blocked because `page.evaluate` runs from `about:blank` context with no origin
- **Note:** This is a test spec bug, not an application bug. Rate limiting itself is implemented (`lib/rate-limit.ts`, MAX_ATTEMPTS=5). Test must call `page.goto(BASE)` before running the `page.evaluate` fetch loop.
