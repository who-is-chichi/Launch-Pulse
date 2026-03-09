# ONC-101 Demo Script — Commercial Insights Platform

## Prerequisites

Before running the demo, reset and seed the database:

```bash
npm run demo:reset
npm run dev
```

Open `http://localhost:3000` and log in with the demo credentials.

---

## Demo Flow (~13 minutes)

### 1. Home Page — Launch Pulse (2 min)

**URL:** `/`

**What to show:**
- 4 KPI tiles at the top:
  - **Demand Momentum: -12.0%** (down, red sparkline)
  - **Time-to-Therapy: 12.4d** (down, rising trend)
  - **Execution Coverage: 73%** (down)
  - **Structure Integrity: 100%** (up)
- "Today's Headlines" section — 5 insights from the latest run
- Driver Breakdown panel showing Demand/Start Ops/Execution/Structure weightings
- "What to Do Next" panel — 3 open actions with owners and due dates
- Data freshness footer — Claims: Fresh, SP Cases: Lag, Territory: Stale

**Talk track:**
> "This is the daily launch pulse for ONC-101. Everything you see here is loaded from the database — 4 weeks of data runs, automatically scoped to the latest complete run. The KPI tiles show demand down 12% week-over-week, and time-to-therapy has risen to 12.4 days."

---

### 1b. Generate Insights from the Engine (30 sec)

**What to do:**
- Open a terminal and run:
  ```bash
  curl -X POST http://localhost:3000/api/engine/run
  ```
- The response shows `{ "ok": true, "insightsCreated": N }` — insights just populated from facts

**Talk track:**
> "The insight engine reads directly from the fact tables — claims, SP cases, and field call data — and fires templates against the latest week's numbers. Every time the engine runs, it replaces that run's insights idempotently. No hand-crafted headlines."

---

### 2. Generate AI Pulse Brief (1 min)

**What to do:**
- Click **"Generate Pulse Brief"** button (top right of home page)
- Wait ~5–10 seconds for the AI summary to appear

**Talk track:**
> "The Pulse Brief button sends the live data to Claude and gets back a plain-English summary of what's happening. This is not a template — it reads the actual KPIs and insight headlines."

---

### 3. Insights Page — Filter and Drill-Down (3 min)

**URL:** `/insights`

**What to show:**
- Table of 5 insights from the latest run
- Filter by **Severity: High** → shows 2 high-severity insights
- Click **"NRx down 12% WoW in Northeast"** row

**On the Insight Detail page:**
- Headline, pillar badge, severity, confidence, status dropdown
- Driver breakdown: Execution 85%, Start Ops 62%, Structure 15%
- Metric Changes: NRx -12%, Market Share -13%, Active Prescribers -8%
- Top Contributors: Memorial Health System, Northeast Health Partners
- Confidence Flags / Risks section

**What to do:**
- Change Status from "Investigating" → "Actioned" using the dropdown
- Show the status persists (it saves to DB via PATCH /api/insights/[id])

**Talk track:**
> "Each insight links through to a detail view with the full analytical breakdown — what's driving it, which accounts are contributing, and what the data caveats are. Status is editable and persists in the database."

---

### 4. Actions & Impact — Kanban (3 min)

**URL:** `/actions`

**What to show:**
- Kanban board with 4 columns: New, In Progress, Blocked, Done
- Multiple cards in each column

**Demo drag-and-drop:**
- Drag "Review T12 call plans..." card from **New** → **In Progress**
- Show it snaps into place

**Demo pick-and-transfer:**
- Hover over any card — "Move to" buttons appear (→ arrows for other columns)
- Click an arrow to move it without dragging

**Demo impact scoring:**
- Drag any card from In Progress → Done
- Impact Score modal appears with fields: Metric, Before, After, Outcome (Yes/Partial/No), Completed Date
- Fill in: `Metric: NRx Volume`, `Before: 345`, `After: 380`, `Outcome: Partial`
- Click **Submit** — card moves to Done, score recorded

**Talk track:**
> "The Kanban is fully interactive. Cards can be dragged or transferred with a click. When you mark something Done, we capture the impact — before/after metrics and whether the outcome was achieved. This feeds into the Impact Scorecard."

---

### 5. Data & Mapping Page (1 min)

**URL:** `/data-mapping`

**What to show:**
- **Latest Drop Status** tab: 3 datasets
  - Claims (Weekly): Fresh (green dot) — coverage 99.2%
  - SP Cases: Lag (yellow dot) — 48h lag from hub partner
  - Territory Alignment: Stale (red dot) — quarterly update pending
- **Mapping Configurations** tab: 4 data source configs
- **Normalization Rules** tab: SP status mapping table, NPI coverage metrics

**Talk track:**
> "Data & Mapping shows the health of your input data. Claims came in fresh this morning, SP cases have a 48-hour lag from the hub partner, and territory alignment is stale pending the Q2 cycle update."

---

### 6. Export Exec Pack (1 min)

**What to do:**
- Go back to Home page (`/`)
- Click **"Export Exec Pack"** button
- File downloads as `exec-pack-ONC-101.html`
- Open the file in a browser

**Talk track:**
> "The Exec Pack exports a self-contained HTML file with KPI snapshot, top insights, open actions, and impact scorecards. It can be emailed or attached to a slide deck."

---

### 7. Global Filter — Brand/Geography Switch (1 min)

**What to do:**
- In the top navigation bar, use the **Geography** dropdown — switch from Nation → Northeast
- Watch the home page insights filter to only Northeast region insights
- Switch **Time Window** filter (if available)

**Talk track:**
> "Filters propagate across all pages. Switching geography or time window triggers a full reload from the database — no client-side mocks."

---

## Reset Between Demos

To restore the database to the original demo state:

```bash
npm run demo:reset
```

This runs `prisma migrate reset --force && prisma db seed` — takes about 15–20 seconds.

---

## QA Check

To validate the demo dataset is correct:

```bash
npx tsx scripts/qa-check.ts
```

Expected output:
```
[Brand]
  ✓ Brand ONC-101 exists

[DataRuns]
  ✓ At least 5 completed DataRuns (4 seeded + 1 engine)
  ...

QA PASSED
```

To run regression checks (idempotency, severity/confidence sanity, missing-data handling):

```bash
npx tsx scripts/regression-check.ts
```

Expected output:
```
[Idempotency]
  ✓ First run generates at least 1 insight
  ✓ Rerun produces identical count (N)

[Severity / Confidence]
  ✓ Severity valid: "..."
  ✓ Confidence valid: "..."

[GoldInputSnapshot]
  ✓ GoldInputSnapshot rows written

[Missing Data Handling]
  ✓ Engine does not crash with missing calls/structure data
  ✓ Engine returns valid count with partial data

REGRESSION PASSED
```
