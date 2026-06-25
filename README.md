# AI Travel Planner

A natural-language travel request (e.g. *"Plan a 5-day trip to Japan. Tokyo + Kyoto. $3,000 budget. Love food and temples, hate crowds."*) becomes a budget-aware, day-by-day itinerary via a multi-agent system:

```
Orchestrator → [Destination, Logistics, Budget in parallel] → Review → itinerary
```

See [`PRD_AI_Travel_Planner.md`](./PRD_AI_Travel_Planner.md) for product scope and [`ImplementationPlan.md`](./ImplementationPlan.md) for the sprint-by-sprint build plan.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript** (strict)
- **Tailwind CSS** — themed from `stitch_responsive_web_interface/modern_editorial_voyager/DESIGN.md`
- **Gemini 2.5 Flash Lite** via `@google/genai` (agents — Sprint 2+)
- **Vitest** (unit/integration, mocked Gemini) + **Playwright** (E2E)

## Getting started

```bash
npm install
cp .env.example .env.local   # add your GEMINI_API_KEY (needed Sprint 2+)
npm run dev                  # http://localhost:3000
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (type-checks) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm test` | Vitest (unit/integration) |
| `npm run test:e2e` | Playwright (E2E) — boots the dev server automatically |

## HTTP API & request flow

The UI talks to two route handlers (full contract in the Sprint 6 handover of
[`ImplementationPlan.md`](./ImplementationPlan.md)):

```
Landing ( / )  ──submit──▶  POST /api/parse   { request }      ──▶ ExtractionResult
                                                                    (complete | needs_clarification)
Confirm (/confirm) ─confirm─▶  POST /api/plan  { constraints }  ──▶ SSE: progress events → final itinerary
Plan    (/plan)  ◀── renders the streamed TripState (progress + itinerary land in Sprint 8)
```

- `POST /api/parse` → `{ request: string }` → `ExtractionResult` (or a structured `ApiError`).
- `POST /api/plan` → `{ constraints: TripConstraints }` → `text/event-stream` of
  `progress` events (orchestrator + the 3 parallel specialists + review) then a terminal `itinerary` event.

## Project structure

```
app/                  Next.js App Router
  page.tsx            Landing screen
  confirm/            Constraint-confirmation screen (calls /api/parse)
  plan/               Plan screen (Sprint 8: progress + itinerary)
  api/
    parse/route.ts    POST /api/parse
    plan/route.ts     POST /api/plan (SSE)
src/
  lib/
    agents/           Orchestrator + specialists + Review + pipeline + cache
    gemini/           Gemini client wrapper (+ mock)
    types/            Domain types + Zod schemas
    prompts/          Per-agent prompt templates
    data/             Sample grounding data (Japan)
    api/              HTTP-independent handlers (parse, plan, guardrails, schemas, deps)
    env.ts · logging.ts · planClient.ts
  components/         Shared React UI (Button, Card, ConstraintSummary, …) + PlanProvider
tests/
  unit/               Vitest (mocked Gemini — no live API calls)
  e2e/                Playwright (stubs /api/parse)
```

> **Status:** Complete (Sprints 1–10) — full multi-agent backend, HTTP API, all screens, hardened.
> See [`ImplementationPlan.md`](./ImplementationPlan.md) for per-sprint handovers and
> [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the system design.

## Testing

```bash
npm test            # Vitest — 193 unit/integration tests, mocked Gemini (no live calls)
npm run test:e2e    # Playwright — 10 journeys + axe a11y scan (uses system Chrome)
```

- E2E uses a **system-installed browser** by default (`channel`) to avoid Playwright's bundled
  download; set `PW_CHANNEL=msedge` to use Edge, or unset it in CI to use the bundled build.

## Deployment

This is a **single full-stack Next.js app** — the UI pages and the `/api/*` routes
deploy together as one unit. Pick **one** target. In both cases the only required
runtime config is the **`GEMINI_API_KEY`** environment variable (use a **paid /
billing-enabled** key — the free tier is 20 req/min and one plan spends several calls).

### Option A — Vercel (serverless)

1. Push to GitHub and import the repo in Vercel (Next.js auto-detected; `vercel.json` included).
2. Set **`GEMINI_API_KEY`** in Project → Settings → Environment Variables.
3. Deploy. The `/api/plan`, `/api/cheaper`, and `/api/regenerate-day` routes run on the Node
   runtime with `maxDuration = 60` (the multi-agent plan takes ~10–40s — Vercel **Pro**
   recommended; Hobby caps functions at 10s, which would cut the plan off).

### Option B — Railway (long-running container) — recommended for the SSE plan route

Railway runs the app as a persistent Node server (`Dockerfile` → `.next/standalone`), so the
streaming `/api/plan` route has **no function time limit**.

1. Push to GitHub and create a Railway project from the repo (`railway.json` selects the `Dockerfile`).
2. Set **`GEMINI_API_KEY`** in the service's **Variables**. Railway injects `PORT` automatically.
3. Deploy. Health-checks hit `/`; the container binds `0.0.0.0:$PORT`.

`npm run build` is the production build (emits `.next/standalone` via `output: "standalone"`).
To run the container locally: `docker build -t voyageai . && docker run -p 3000:3000 -e GEMINI_API_KEY=… voyageai`.
