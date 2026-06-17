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

## Project structure

```
app/                  Next.js App Router (routes + pages)
  api/                Route handlers (Sprint 6)
src/
  lib/
    agents/           Orchestrator + specialists + Review (Sprints 2–5)
    gemini/           Gemini client wrapper (Sprint 2)
    types/            Domain types + Zod schemas (Sprint 2)
    prompts/          Per-agent prompt templates (Sprints 3–5)
    data/             Sample grounding data (Sprints 4–5)
  components/         Shared React UI (Sprint 7+)
tests/
  unit/               Vitest
  e2e/                Playwright
```
