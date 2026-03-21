# Settings Page — E2E Test Results

**Date:** 2026-03-20
**Agent:** Test Agent 5
**Suite:** `testing/settings.spec.ts`
**Base URL:** `http://localhost:3000`
**Demo user:** `alex@company.com` / `password123`

---

## Summary

| Metric | Value |
|--------|-------|
| Total tests | 10 |
| Passed | 0 |
| Failed | 10 |
| Skipped | 0 |

**Root cause:** PostgreSQL is not running at `localhost:5432`. Every call to `POST /api/auth/login` returns HTTP 500 (Prisma connection error). The login page handler never sets a session cookie and never triggers `window.location.href = '/home'`. As a result, `waitForURL(/home/)` times out in every test and no settings page functionality can be exercised.

---

## Test Results

| Test | Description | Result | Notes |
|------|-------------|--------|-------|
| S1 | Settings page loads with profile data | FAIL | `TimeoutError: page.waitForURL: Timeout 15000ms exceeded` — login API returns 500 (DB down); page navigates to `/login` twice then stalls |
| S2 | Email field is read-only | FAIL | `Test timeout of 45000ms exceeded` — stuck waiting for `input[type="email"]` on login page; cannot reach /settings |
| S3 | First name input is editable | FAIL | `Test timeout of 45000ms exceeded` — same root cause; cannot log in |
| S4 | Save changes triggers toast | FAIL | `Test timeout of 45000ms exceeded` — cannot log in; profile save flow never reached |
| S5 | Name change persists after reload | FAIL | `Test timeout of 45000ms exceeded` — cannot log in; persistence check never executed |
| S6 | Notification toggles visible | FAIL | `Test timeout of 45000ms exceeded` — cannot log in; notification section never loaded |
| S7 | Notification toggle fires PATCH request | FAIL | `Test timeout of 45000ms exceeded` — cannot log in; PATCH /api/settings/preferences never called |
| S8 | Data preferences section exists | FAIL | `Test timeout of 45000ms exceeded` — cannot log in; data preferences section never loaded |
| S9 | Save preferences triggers toast | FAIL | `Test timeout of 45000ms exceeded` — cannot log in; preferences save never triggered |
| S10 | Security section controls are disabled | FAIL | `Test timeout of 45000ms exceeded` — cannot log in; security section never reached |

---

## Failure Details

### S1 — `TimeoutError: page.waitForURL: Timeout 15000ms exceeded`

```
waiting for navigation until "load"
  navigated to "http://localhost:3000/login"
  navigated to "http://localhost:3000/login"
```

The sequence is: `page.goto('/login')` → form fills succeed → button click submits → `POST /api/auth/login` returns 500 → login page sets error state but `window.location.href = '/home'` is never called → middleware on any `/home` attempt also redirects back to `/login` → `waitForURL(/home/)` waits 15 s and times out.

### S2–S10 — `Test timeout of 45000ms exceeded` on `page.fill('input[type="email"]')`

After S1's failure, the browser context is left on `about:blank` (fresh context per test). Each subsequent test opens `/login`, but the login form email input never becomes interactable within 45 s. This is a cascading symptom of the same infrastructure issue: the Next.js server is serving the login page but the form's hydration or loading state is stuck — likely because the React client component is caught in an unhandled error cycle from the failed API call in the prior page session.

---

## Code Analysis (from source review)

The following settings page features were verified **by source inspection** to be implemented correctly (pending DB availability for live testing):

| Feature | Implementation Status |
|---------|----------------------|
| Profile form (firstName, lastName) — editable inputs | Implemented in `app/(app)/settings/page.tsx` lines 154–172 |
| Email field — `disabled` attribute | Implemented at line 181 (`disabled` prop, no onChange) |
| Role field — `disabled` attribute | Implemented at line 190 (`disabled` prop) |
| Save Profile button → PATCH `/api/auth/me` → `toast.success('Profile updated')` | Implemented at lines 112–127, 194–201 |
| Notification toggles (`[role="switch"]`) — 4 toggles | Implemented at lines 216–234 via `<Switch>` components |
| Toggle → PATCH `/api/settings/preferences` | Implemented at lines 73–89 (`handleNotifyToggle`) |
| Data preferences section (defaultBrand, defaultTimeWindow, defaultGeography) | Implemented at lines 248–278 |
| Save Preferences button → PATCH `/api/settings/preferences` → `toast.success('Preferences saved')` | Implemented at lines 91–110, 279–286 |
| Security section (Two-factor, Session timeout, Change Password) | Implemented at lines 289–318 |
| Change Password button — `disabled` attribute | Implemented at line 315 (`variant="outline" disabled`) |
| Two-factor Switch — `disabled` attribute | Implemented at line 306 |

---

## Bugs Found

See `bugs.md` entries `BUG-S01`.

All settings-specific functional bugs are **blocked by the infrastructure issue** (DB down). The only new bug logged is the infrastructure blocker itself (already partially captured as BUG-DM02 / BUG-A01 in prior agents; logged here as BUG-S01 for completeness of this agent's scope).
