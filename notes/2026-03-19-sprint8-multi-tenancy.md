# Sprint 8 — Multi-Tenancy Enforcement, Settings Persistence, AI Rate Limiting

**Date:** 2026-03-19
**Sprint:** 8

---

## What Changed

### Schema (Agent A)
- `Brand.orgId` changed from nullable `String?` to `NOT NULL String @default("org_default")` — enforces tenant isolation at the DB level
- `UserPreference` model added — stores per-user notification and display preferences, linked to `User.id`
- Migration: `20260318193610_sprint8_schema`
- New lib files:
  - `lib/request-context.ts` — extracts `getOrgId`, `getUserId`, `getUserRole`, and the key `assertBrandAccess` helper
  - `lib/api-rate-limit.ts` — sliding window rate limiter for API endpoints (separate from login rate limiter)

### API Route Enforcement (Agent B — 14 routes)
All brand-scoped API routes now call `assertBrandAccess(orgId, brandCode)` before any data access:
- `app/api/brands/route.ts` — filters `findMany` by `orgId`
- `app/api/insights/route.ts` and `[id]/route.ts`
- `app/api/actions/route.ts` (also adds `page`/`pageSize` pagination) and `[id]/route.ts`
- `app/api/runs/route.ts` and `[id]/generate-insights/route.ts`
- `app/api/data-status/route.ts`
- `app/api/admin/data-status/route.ts` (admin-only role guard + assertBrandAccess)
- `app/api/engine/run/route.ts` (+ engine rate limit: 5 req/min)
- `app/api/data-mapping/configs/route.ts`, `rules/route.ts`, `upload/route.ts`
- `app/api/export/exec-pack/route.ts`

Cross-tenant access returns 404 (not 403) to avoid confirming resource existence.

### Settings + UI (Agent C)
- `app/api/settings/preferences/route.ts` — GET returns current preferences (with defaults); PATCH upserts by `userId` from header
- `app/api/auth/me/route.ts` — PATCH endpoint for name updates
- `app/(app)/settings/page.tsx` — fully rewritten with controlled React state, real API calls to both endpoints, sonner toasts for save feedback
- `app/(app)/layout.tsx` — `<Toaster />` (sonner, bottom-right) added to app shell

### AI Rate Limiting
- `app/api/ai/summary/route.ts`, `insight-narrative/route.ts`, `pulse-brief/route.ts` — all call `checkApiRateLimit(userId, 'ai')` → 20 req/min per user

---

## Key Decisions

1. **assertBrandAccess returns 404 not 403** — avoids cross-tenant resource enumeration
2. **Separate rate limiters** — `lib/rate-limit.ts` is for login brute-force; `lib/api-rate-limit.ts` is for AI/engine endpoints. Different use cases, different tuning.
3. **UserPreference as standalone model** — not embedded in User, allows future expansion without schema churn
4. **Pagination backward compatible** — `GET /api/actions` defaults to `page=1, pageSize=50` so existing callers are unaffected

---

## Verification Results

- `npx tsc --noEmit` — clean (0 errors)
- `npx vitest run` — 308 passed (44 core tests × 7 test suites including worktrees)
- `npx tsx scripts/qa-check.ts` — 114/114 passed
- `npx tsx scripts/regression-check.ts` — 16/16 passed
- Prisma migration status — all 11 migrations applied, database up to date

---

## Lessons

- Worktree IDs in sprint instructions may not match the actual worktree folder names — always enumerate `.claude/worktrees/` to find what actually exists
- Sprint 8 work was already present as unstaged changes in the main working tree; the merge step was confirming completeness rather than copying files
