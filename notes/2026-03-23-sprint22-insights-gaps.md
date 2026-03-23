# Sprint 22 — Insights Page Gap Fixes

**Date:** 2026-03-23
**Status:** Complete
**TypeScript:** Clean (`npx tsc --noEmit`)
**QA:** 36/36 assertions pass (`scripts/sprint22-check.ts`)

---

## Why This Was Built

Full review of the Insights page revealed 8 gaps where buttons and sections were scaffolded as placeholders but never wired up. All were fixed before moving to the Bronze→Silver→Gold AI data pipeline work.

---

## Gaps Fixed

| # | Gap | Fix |
|---|-----|-----|
| 1 | "Create Action Item" in AI Summary Panel — no onClick | Added `onCreateAction` callback prop to `AISummaryPanel`, wired to `CreateActionModal` in `InsightsClient` |
| 2 | "Bulk Assign" button — no onClick, no modal | New `BulkAssignModal` component; sequential POST loop per selected insight |
| 3 | "Assign" button on Insight Detail page header — no onClick | Wired to `showActionModal` state; gated by `regional_director` role |
| 4 | "Export Slide" button — no onClick | `exportInsightSlide()` generates safe HTML download client-side |
| 5 | Evidence section — emoji placeholder | Sparkline mini-charts (recharts) with seeded/interpolated trend data per metricChange |
| 6 | Discussion tab — stub only | Removed; Notes section is now just the Timeline (textarea + Save Notes) |
| 7 | "AI Interpretation" buried 5th on page | Renamed to "AI Summary", moved to top of detail page (after metadata row) |
| 8 | PATCH `/api/data-mapping/configs` and `/api/data-mapping/rules` missing `requireRole` | Added `requireRole(request, 'analytics_manager')` to both PATCH handlers |

---

## New Shared Components

### `components/CreateActionModal.tsx`

Extracted from the inline modal in `InsightDetailClient.tsx`. Self-contained: manages its own form state, submission to `POST /api/actions`, success/error toasts.

Props:
```typescript
{
  open: boolean;
  onClose: () => void;
  brandCode: string;
  prefill?: { title?, severity?, notes?, linkedInsight?, insightId? };
  onSuccess?: () => void;
}
```

Used by: `InsightDetailClient` (Assign button + Recommended Actions), `InsightsClient` (AI Summary Panel callback).

### `components/BulkAssignModal.tsx`

Modal for bulk-creating actions from multiple selected insights. Shows selected headline list, collects owner/due date/expected lag, then POSTs sequentially to `/api/actions` for each insight with its own `insightId` and `linkedInsight`.

---

## Evidence Section — Sparklines

- Uses `recharts` (v2.15.2, already in project)
- 6 data points per metric: interpolated between `before` and `after` with ±15% seeded jitter (deterministic from metric name)
- Color: green (`#16A34A`) for up, red (`#DC2626`) for down
- **Note:** Data is seeded. Replace with real `MetricTimeSeries` Gold table data in future sprint.

---

## Security Fixes (from staff engineer review)

1. **XSS in HTML export**: Added `escapeHtml()` helper applied to all data interpolated into `exportInsightSlide()` output
2. **Missing RBAC on "Create Action Item"**: Button in Recommended Actions section now gated by `hasMinRole(userRole, 'regional_director')`
3. **Wrong `linkedInsight` in AI panel**: Fixed to match insight by pillar (`insights.find(i => i.pillar === pair.impact.pillar)`) instead of always using `insights[0]`
4. **Missing `aria-label`**: Close buttons on both modals now have `aria-label="Close"`

---

## RBAC Summary

| Feature | UI Gate | API Gate |
|---------|---------|---------|
| Create Action (any surface) | `regional_director+` | `requireRole('regional_director')` |
| Bulk Assign | `regional_director+` | `requireRole('regional_director')` per action |
| Assign button (detail header) | `regional_director+` | `requireRole('regional_director')` |
| AI Summary Panel | `executive+` | `requireRole('executive')` |
| Data Mapping PATCH | `analytics_manager+` (now) | `requireRole('analytics_manager')` |

---

## Files Changed

| File | Change |
|------|--------|
| `components/CreateActionModal.tsx` | **New** — shared action creation modal |
| `components/BulkAssignModal.tsx` | **New** — bulk assign modal |
| `components/AISummaryPanel.tsx` | `onCreateAction` + `userRole` props, button wired |
| `components/ActionItem.tsx` | Removed non-functional "Create Action Item" button |
| `app/(app)/insights/InsightsClient.tsx` | AI Summary callback, Bulk Assign modal, action modal state |
| `app/(app)/insights/page.tsx` | Passes `userRole` to client |
| `app/(app)/insights/[id]/InsightDetailClient.tsx` | AI Summary moved to top, sparklines, no Discussion tab, Assign + Export Slide wired, RBAC guard on Create Action, XSS fix |
| `app/(app)/insights/[id]/page.tsx` | Passes `userRole` to InsightDetailClient |
| `app/api/data-mapping/configs/route.ts` | `requireRole` added to PATCH |
| `app/api/data-mapping/rules/route.ts` | `requireRole` added to PATCH |
| `scripts/sprint22-check.ts` | **New** — 36 QA assertions for Sprint 22 |

---

## QA

New script: `scripts/sprint22-check.ts` — 36 assertions covering:
- Component existence and exports
- AISummaryPanel callback wiring
- InsightsClient state and modal renders
- Detail page section ordering (AI Summary before What Changed)
- No Discussion tab
- Recharts import + sparkline helper
- PATCH requireRole on both data-mapping routes

Run: `npx ts-node scripts/sprint22-check.ts`
