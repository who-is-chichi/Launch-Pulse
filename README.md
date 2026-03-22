# Launch Pulse — Commercial Insights Platform

**Launch Pulse** is a real-time commercial insights platform for pharmaceutical launch teams. It ingests raw data from claims vendors, SP hubs, CRM systems, and field roster feeds, runs an automated daily insight engine, and surfaces demand, start ops, execution, and structure signals to brand managers, sales ops leads, and field leadership — all in one place.

Demo brand: **ONC-101**

---

## Features

### Home Dashboard
- KPI tiles: NRx weekly trend, time-to-therapy (TTT), HCP coverage, territory churn
- AI Pulse Brief — Claude-powered narrative summary of the week's signals
- Dynamic "Last data drop" timestamp from live ingestion run history

### Insights
- Paginated insight list across 4 pillars: Demand, Start Ops, Execution, Structure
- Server-side filtering by pillar, geography, and brand (URL-driven — survives page refresh)
- Geography fallback to Nation when no data exists for the selected geography
- Insight detail: full narrative, severity badge, notes editor, share link

### Actions
- Kanban board with drag-and-drop across status columns (Pending → In Progress → Done)
- Impact scoring with visual score bar
- Create/edit actions with due date, owner, priority, and linked insight
- Bulk CSV export of selected actions

### Data & Mapping
- Dataset freshness status (Gold-layer `Dataset` rows + Bronze ingestion run history)
- Normalization rules editor with inline PATCH modal
- Upload Mapping Wizard — 5-step wizard to configure field mappings; target field dropdown is scoped to the real Bronze table columns for the selected dataset type (Claims, Dispense, SP Cases, Calls, Structure)
- ID crosswalk coverage stats
- Recent ingestion runs: last 5 `BronzeCtlIngestionRun` rows with status, row counts, and file manifest

### Notifications
- Bell icon with red dot when high-severity insights or overdue actions exist
- Lazy-loaded popover with two sections: critical insights + overdue actions

### Export
- Exec Pack: full HTML report (brand summary + insights + actions) download
- Insights CSV export with bulk selection checkboxes

---

## Prerequisites

- Node.js 18+
- PostgreSQL 15+ (or Docker)
- An Anthropic API key (for AI Pulse Brief and AI Summary features)

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and set:
- `DATABASE_URL` — your PostgreSQL connection string
- `ANTHROPIC_API_KEY` — your Anthropic API key
- `INTERNAL_SECRET` — any random string (used by Edge Runtime middleware to verify sessions internally)

### 3. Set up the database and seed demo data

```bash
npm run demo:reset
```

This runs `prisma migrate reset --force && prisma db seed`, which:
- Creates all tables via Prisma migrations (including the full Bronze layer)
- Seeds brand ONC-101 with 4 weekly data runs, 14 insights, 8 actions, KPI tiles, dataset freshness rows, normalization rules, and ID crosswalk stats

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Log in with the demo session (any submission on the login page works).

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:seed` | Seed (or re-seed) demo data without resetting migrations |
| `npm run db:reset` | Reset DB and re-run migrations (no seed) |
| `npm run demo:reset` | Full reset: migrate + seed (use before demos) |

---

## QA Validation

After seeding, run the QA check to verify the demo dataset is complete:

```bash
npx tsx scripts/qa-check.ts        # 114 assertions — DataRuns, KPI tiles, insights, actions, impact scores
npx tsx scripts/regression-check.ts   # 16 engine regression checks
npx tsx scripts/sprint14-check.ts  # 15 checks — threshold centralization
npx tsx scripts/sprint15-check.ts  # 30 checks — Bronze layer + ingest route
```

---

## Ingest API

External systems (ETL pipelines, SP hubs, CRM vendors) push raw data via:

```
POST /api/ingest/facts
Authorization: <session cookie>
Content-Type: application/json
```

Request body (any combination of dataset arrays):
```json
{
  "brandCode": "ONC-101",
  "sourceSystem": "hub_api",
  "sourceFeedName": "sp_case_extract_daily",
  "fileName": "sp_cases_2026-03-22.csv",
  "spCases": [ { "spCaseId": "...", "caseStatusRaw": "Approved", ... } ],
  "claims": [ { "claimId": "...", "ndc11": "...", "nrx": 12, ... } ]
}
```

Response:
```json
{
  "ok": true,
  "ingestionRunId": "clx...",
  "dataRunId": "clx...",
  "accepted": 42,
  "rejected": 0,
  "insightsCreated": 3,
  "actionsEvaluated": 8
}
```

The endpoint:
1. Creates a `BronzeCtlIngestionRun` (audit record) before any row inserts
2. Writes each row to the appropriate `Bronze*Raw` table with a SHA-256 `recordHash` and full `rawPayload` blob
3. Logs rejected rows to `BronzeCtlRowRejection` — valid rows still ingest
4. Auto-triggers the insight engine and action evaluator
5. Returns accepted/rejected counts and engine output

Ingestion run history is visible in the **Data & Mapping → Latest Drop Status** tab.

---

## Docker Deploy

The project ships with a Dockerfile and docker-compose.yml for containerised deployment.

```bash
docker compose up --build
```

This starts:
1. PostgreSQL 16 (port 5432)
2. Migration + seed service
3. Next.js app (port 3000)

Environment variables can be passed via a `.env` file or `docker-compose.override.yml`.

---

## Demo Script

See [`scripts/demo-script.md`](scripts/demo-script.md) for the full click-path walkthrough covering:
- Home page KPI tiles and AI Pulse Brief
- Insights filtering and drill-down
- Actions Kanban (drag-and-drop + impact scoring)
- Data & Mapping freshness status
- Export Exec Pack download

---

## Architecture

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 App Router, React 18, Tailwind CSS, Framer Motion |
| Database | PostgreSQL + Prisma ORM |
| AI | Anthropic Claude (claude-opus-4-6) |
| Deploy | Docker + standalone Next.js output |

### Data Layers

```
Bronze  →  Silver (future)  →  Gold
  ↑                              ↓
POST /api/ingest/facts    Insight Engine
  (raw, append-only)      (6 templates)
```

- **Bronze** — 6 `BronzeCtl*` audit/control tables + 11 `Bronze*Raw` source tables. Append-only, source-native. Every row carries a SHA-256 `recordHash`, full `rawPayload` JSON blob, and a 25-field common metadata block (ingestion run ID, file manifest ID, source file path, parse status, etc.)
- **Gold** — Engine-aggregated fact tables (`ClaimsMetricsFact`, `SpMetricsFact`, etc.) populated by `prisma/seed.ts` in demo mode; will be populated by Silver→Gold transforms in production
- **Insight Engine** — 6 templates across 4 pillars; thresholds centralized in `lib/insight-engine/thresholds.ts`; triggered on every ingest or via `POST /api/engine/run`

### Key Directories

```
app/(app)/          — authenticated pages (home, insights, actions, data-mapping)
app/api/            — API routes
  ingest/facts/     — Bronze ingest endpoint
  ingest/runs/      — GET ingestion run history
  engine/run/       — manual engine trigger
  export/           — Exec Pack + CSV export
lib/
  insight-engine/   — 6 templates + thresholds + engine runner
  ingest-helpers.ts — computeRowHash (SHA-256)
  rbac.ts / request-context.ts — RBAC (getOrgId + assertBrandAccess)
  logger.ts         — structured JSON logging (required on all API routes)
prisma/
  schema.prisma     — full schema (Gold + Bronze layers)
  seed.ts           — idempotent demo seed
scripts/
  qa-check.ts       — 114 assertions
  regression-check.ts — 16 engine regression checks
  sprint14-check.ts / sprint15-check.ts — sprint-specific smoke checks
```
