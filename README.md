# Commercial Insights Platform

A real-time launch insights platform for pharmaceutical commercial teams. Surfaces demand, start ops, execution, and structure signals from claims, SP, and field data via a daily automated engine.

## Prerequisites

- Node.js 18+
- PostgreSQL 15+ (or Docker)
- An Anthropic API key (for AI Pulse Brief and AI Summary features)

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

### 3. Set up the database and seed demo data

```bash
npm run demo:reset
```

This runs `prisma migrate reset --force && prisma db seed`, which:
- Creates all tables via Prisma migrations
- Seeds brand ONC-101 with 4 weekly data runs, 14 insights, 8 actions, KPI tiles, and dataset freshness rows

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
npx tsx scripts/qa-check.ts
```

Expected: all assertions pass — 5 DataRuns, 4 KPI tiles, 14+ insights, 8+ actions, 2+ impact scores.

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
| Frontend | Next.js 15 App Router, React 18, Tailwind CSS |
| Database | PostgreSQL + Prisma ORM |
| AI | Anthropic Claude (claude-opus-4-6) |
| Deploy | Docker + standalone Next.js output |

Key directories:
- `app/(app)/` — authenticated app pages (home, insights, actions, data-mapping)
- `app/api/` — API routes (brands, insights, actions, home, runs, export)
- `lib/insight-engine/` — automated insight generation engine
- `prisma/` — schema, migrations, seed
- `scripts/` — qa-check.ts, demo-script.md
