# Task Plan

> This file is the active task plan. Updated throughout every task.
> Format: check off items as completed. Add a Review section when done.

---

# Sprint 8 — Multi-Tenancy Enforcement + Settings

## Status: COMPLETE

## Tasks

### Schema + Lib
- [x] Change Brand.orgId from nullable to NOT NULL with default "org_default"
- [x] Add UserPreference model to prisma/schema.prisma
- [x] Run `npx prisma migrate dev --name sprint8_schema`
- [x] Update prisma/seed.ts — add orgId to brand upsert, add UserPreference seed
- [x] Create lib/request-context.ts (getOrgId, getUserId, getUserRole, assertBrandAccess)
- [x] Create lib/api-rate-limit.ts (checkApiRateLimit — sliding window, AI: 20/min, engine: 5/min)
- [x] npx prisma db seed — passes ✅

### API Route Enforcement (orgId on all routes)
- [x] app/api/brands/route.ts — filter findMany by orgId
- [x] app/api/insights/route.ts — assertBrandAccess + logger.error fix
- [x] app/api/insights/[id]/route.ts — require brandCode, assertBrandAccess
- [x] app/api/actions/route.ts — assertBrandAccess + pagination (page/pageSize)
- [x] app/api/actions/[id]/route.ts — assertBrandAccess (brandCode in body)
- [x] app/api/runs/route.ts — assertBrandAccess + logger.error fix
- [x] app/api/runs/[id]/generate-insights/route.ts — assertBrandAccess
- [x] app/api/data-status/route.ts — assertBrandAccess + logger.error fix
- [x] app/api/admin/data-status/route.ts — role guard + assertBrandAccess
- [x] app/api/engine/run/route.ts — assertBrandAccess + rate limit
- [x] app/api/data-mapping/configs/route.ts — assertBrandAccess
- [x] app/api/data-mapping/rules/route.ts — assertBrandAccess
- [x] app/api/data-mapping/upload/route.ts — assertBrandAccess
- [x] app/api/export/exec-pack/route.ts — assertBrandAccess

### Settings + UI
- [x] Create app/api/settings/preferences/route.ts (GET + PATCH, upsert on userId from header)
- [x] Add PATCH handler to app/api/auth/me/route.ts (name update only)
- [x] Rewrite app/(app)/settings/page.tsx — controlled state, fetch from both APIs, sonner toasts
- [x] Add <Toaster /> to app/(app)/layout.tsx

### AI Rate Limiting
- [x] app/api/ai/summary/route.ts — checkApiRateLimit
- [x] app/api/ai/insight-narrative/route.ts — checkApiRateLimit
- [x] app/api/ai/pulse-brief/route.ts — checkApiRateLimit

### Verification
- [x] Restart dev server after migration
- [x] npx tsc --noEmit — zero errors ✅
- [x] npx vitest run — 44 tests pass ✅
- [x] npx tsx scripts/qa-check.ts — 114/114 ✅
- [x] npx tsx scripts/regression-check.ts — passes ✅

### Completion
- [x] Create notes/2026-03-19-sprint8-multi-tenancy.md
- [x] Commit + push + create PR

---

## Review

All Sprint 8 acceptance criteria met:
- Brand.orgId enforced: all 14 API routes filter by orgId via assertBrandAccess
- No bare brand lookups in any route — assertBrandAccess is the single access point
- UserPreference model added; GET/PATCH /api/settings/preferences wired
- Settings page: full controlled state, real API calls, sonner toasts
- AI rate limiting: 20 req/min per user; engine: 5 req/min
- Pagination on GET /api/actions (page/pageSize, backward compatible)
- TypeScript clean, 44 vitest tests pass, 114 QA assertions pass

## Next Sprint
Sprint 9 — UX Completeness
