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

## Post-Sprint 9 — Middleware Edge Runtime Fix (2026-03-21)

### Status: COMPLETE

- [x] Diagnose login redirect loop (middleware Prisma → Edge Runtime incompatibility)
- [x] Create app/api/auth/verify-session/route.ts (internal tokenVersion check)
- [x] Update middleware.ts to use fetch instead of Prisma
- [x] Add INTERNAL_SECRET to .env.local
- [x] Accessibility: add role/aria-modal/aria-labelledby to modals in ActionsClient, DataMappingClient, UploadMappingWizard, InsightDetailClient
- [x] Write notes/2026-03-21-middleware-edge-runtime-fix.md
- [x] npx tsc --noEmit → clean
