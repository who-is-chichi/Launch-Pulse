# Task Plan

> This file is the active task plan. Updated throughout every task.
> Format: check off items as completed. Add a Review section when done.

---

# Sprint 9 — UX Completeness

## Status: IN PROGRESS

## Tasks

### Pre-work
- [x] Write tasks/todo.md

### Agent A — Quick Wins
- [x] Fix HomeClient console.error → logger.error
- [x] Wire Share button (copy link to clipboard + toast) on Insight Detail
- [x] Verify / wire Save Notes button on Insight Detail
- [x] Add error toasts (sonner) to Home, Insights list, Insight Detail, Data Mapping catch blocks
- [x] Fix dynamic "Last data drop" timestamp in Sidebar (remove hardcoded date)

### Agent B — Export Selected
- [x] Add `selectedIds: Set<string>` state to InsightsClient
- [x] Wire checkbox `checked` + `onCheckedChange` on each insight row
- [x] Add select-all checkbox in table header
- [x] Disable Export button when no selection; show count badge when selected
- [x] Create `lib/export-csv.ts` with `exportInsightsToCsv(insights)` helper
- [x] Wire Export button to download CSV

### Agent C — Notification Bell
- [x] Create `components/layout/NotificationPanel.tsx` (Popover with two sections)
- [x] Lazy-fetch high-severity insights + due actions on popover open
- [x] Show loading skeleton + empty state
- [x] Dynamic red dot: only shown when critical insights or overdue actions exist
- [x] Wire bell button in TopBar.tsx to NotificationPanel

### Verification
- [x] npx tsc --noEmit — zero errors
- [x] npx vitest run — 352 tests pass
- [x] npx tsx scripts/qa-check.ts — 114/114
- [x] npx tsx scripts/regression-check.ts — 16/16 passes

### Completion
- [x] Create notes/2026-03-19-sprint9-ux-completeness.md
- [x] Commit + push + create PR

---

# Sprint 12 — Home & Insights Filter Fixes (2026-03-22)

## Status: IN PROGRESS

## Context
Full codebase audit revealed 3 filter UX gaps:
1. FilterContext initializes from hardcoded defaults, not URL — TopBar resets on page refresh
2. Non-Nation geographies return blank page (no DataRun for those geographies in seed)
3. Insights pillar filter is client-side — with pagination, only filters current 10-row page

## Tasks

### Pre-work
- [x] Write tasks/todo.md

### Agent 1 — FilterContext URL initialization
- [x] Fix `components/FilterContext.tsx` to initialize brand/timeWindow/geography from `useSearchParams()`
- [x] Wrap with `<Suspense>` boundary per Next.js 15 requirement

### Agent 2 — Home page geography fallback
- [x] Fix `app/(app)/home/page.tsx` to fall back to Nation DataRun when selected geography has no data
- [x] Pass `geographyFallback: boolean` + `selectedGeography: string` props to `HomeClient`
- [x] Fix `app/(app)/home/HomeClient.tsx` to show info banner when `geographyFallback=true`

### Agent 3 — Insights page: geography fallback + pillar server-side
- [x] Fix `app/(app)/insights/page.tsx` for same geography fallback
- [x] Add `pillar` to URL searchParams read + Prisma `where` clause in `insights/page.tsx`
- [x] Fix `app/(app)/insights/InsightsClient.tsx` pillar dropdown to use `router.push()` (URL-driven)

### Staff Engineer Review → Fix Round
- [x] Fix `geographyFallback` computed after fallback query in `home/page.tsx` and `insights/page.tsx`
- [x] Add `VALID_PILLARS` allowlist in `insights/page.tsx`
- [x] Fix `useEffect` early-return guard in `InsightsClient.tsx`; replace `window.location.search` with `searchParams.toString()`

### Agent 6 — QA + Verification
- [x] `npx tsc --noEmit` — 0 errors ✅
- [x] `npx vitest run` — 44/44 tests pass ✅
- [x] `npx tsx scripts/qa-check.ts` — 114/114 ✅
- [x] `npx tsx scripts/regression-check.ts` — 16/16 ✅

### Completion
- [x] Create `notes/2026-03-22-sprint12-filter-fixes.md`
- [ ] Commit with descriptive message

## Status: COMPLETE

---

## Post-Sprint 9 — Middleware Edge Runtime Fix (2026-03-21)

### Status: COMPLETE

- [x] Diagnose login redirect loop (middleware Prisma → Edge Runtime incompatibility)
- [x] Create app/api/auth/verify-session/route.ts (internal tokenVersion check)
- [x] Update middleware.ts to use fetch instead of Prisma
- [x] Add INTERNAL_SECRET to .env.local
- [x] Accessibility: add role/aria-modal/aria-labelledby to modals in ActionsClient, DataMappingClient, UploadMappingWizard, InsightDetailClient
- [x] Write notes/2026-03-21-middleware-edge-runtime-fix.md
- [x] npx tsc --noEmit → clean
