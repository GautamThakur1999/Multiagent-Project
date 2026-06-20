# CLAUDE.md

AI Travel Planner — a natural-language travel request becomes a budget-aware, day-by-day itinerary via a multi-agent system: `Orchestrator → [Destination, Logistics, Budget in parallel] → Review`.

## Sources of truth (read before working)
- **`ImplementationPlan.md`** — the build is 10 sequential sprints, one per Claude Code session. Read §0 (rules), §1 (locked decisions), your sprint's section, and the latest **Progress Log & Handover** entry. **At the end of every sprint, update this file** (acceptance checkboxes, Status, snapshot table, handover entry) — it is the handover to the next session.
- **`PRD_AI_Travel_Planner.md`** — product scope, goals, agents, edge cases.
- **Design:** `stitch_responsive_web_interface/` (6 screen exports — reference only, rebuild as React, don't ship raw HTML). Tokens: `stitch_responsive_web_interface/modern_editorial_voyager/DESIGN.md` (authoritative). Ignore the root `DESIGN.md` — it's a superseded brief.

## Locked decisions (do not re-litigate — see §1 of the plan)
- TypeScript strict + Next.js (App Router, v14+). Single app, not a monorepo. Node 20.
- Tailwind themed from the `modern_editorial_voyager` tokens; fonts Plus Jakarta Sans + Material Symbols Outlined.
- LLM: **Gemini 2.5 Flash Lite** (`gemini-2.5-flash-lite`) via `@google/genai`, all agents.
- Zod for all agent/API/env I/O; SSE for the progress stream.
- Tests: Vitest (mocked Gemini — **no live API calls in tests**) + Playwright.
- v1 is stateless server-side; saved trips → `localStorage`. No DB.

## Layout
- `app/` routes (`/`, `/confirm`, `/plan`) + `app/api/` handlers (`parse`, `plan`-SSE) · `src/lib/{agents,gemini,types,prompts,data,api}` (+ `env`, `logging`, `planClient`) · `src/components` (+ `PlanProvider`) · `tests/`
- **Flow:** Landing → `POST /api/parse` → Confirm (edit constraints) → `POST /api/plan` (SSE) → Plan. API contract lives in the Sprint 6 handover of `ImplementationPlan.md`.

## Commands
- `npm run dev` · `npm run build` · `npm run lint` · `npm test` (Vitest) · `npm run test:e2e` (Playwright)

## Working rules
- **Do only your sprint's scope.** Out-of-scope issues → note in the handover, don't fix now.
- Reuse existing types/clients/components; read the files your sprint names, not the whole repo.
- Verify before claiming done: run build, lint, tests; paste real output into the handover.
