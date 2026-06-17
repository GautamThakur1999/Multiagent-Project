# Implementation Plan — AI Travel Planner

> **Audience:** Claude Code. This plan is executed across **10 sequential Claude Code sessions**, one sprint per session.
> **Source of truth for product scope:** `PRD_AI_Travel_Planner.md`
> **Source of truth for visual design:** `stitch_responsive_web_interface/` (6 screen exports) and `stitch_responsive_web_interface/modern_editorial_voyager/DESIGN.md` (design tokens).
> **LLM of record:** Google **Gemini 2.5 Flash Lite** (`gemini-2.5-flash-lite`) for all agents.

---

## 0. How to use this document (READ FIRST, EVERY SESSION)

1. **You are running exactly one sprint.** Find your sprint number (given in the starting prompt). Do **only** that sprint's scope. Do not start the next sprint.
2. **Read the handover before coding.** Read §"Progress Log & Handover" at the bottom — the previous sprint left notes there about what was actually built, decisions made, and gotchas. Trust it over assumptions.
3. **Stay in scope.** Each sprint lists **In scope** and **Out of scope**. If you find something out of scope that's broken, note it in the handover for a later sprint — do not fix it now (context budget is precious).
4. **At the end of your sprint, you MUST update this file:**
   - Tick the sprint's acceptance-criteria checkboxes that you completed.
   - Set the sprint **Status** to `DONE` (or `PARTIAL` with a reason).
   - Fill in the **Progress Log & Handover** entry for your sprint: what you built, key files, decisions, deviations from this plan, known issues, and **the exact first thing the next sprint should verify**.
   - Update the **Current State Snapshot** table.
5. **Keep the context window lean.** Prefer reading the specific files this sprint names rather than the whole repo. Don't re-derive decisions already recorded in the handover.
6. **Verify before you claim done.** Run the build, lint, and the tests this sprint adds. Paste real output into the handover, not "should pass."

---

## 1. Locked technical decisions (Sprint 1 establishes these; later sprints must follow)

These are fixed so sessions don't re-litigate architecture and waste context. If a sprint must change one, record it loudly in the handover.

| Area | Decision |
|---|---|
| **Language** | TypeScript (strict mode) end-to-end — one language for max context efficiency. |
| **Framework** | Next.js (App Router, v14+) — full-stack: React frontend + route handlers for the API. |
| **Styling** | Tailwind CSS, configured with the exact tokens from `stitch_responsive_web_interface/modern_editorial_voyager/DESIGN.md` (primary `#006161`, surface `#faf9f7`, `category-*`/`priority-*`). Fonts: Plus Jakarta Sans + Material Symbols Outlined. ⚠️ **The root `DESIGN.md` is a superseded input brief** (it lists teal `#0F766E` / Inter / Lucide) — do NOT port from it; the `modern_editorial_voyager/DESIGN.md` export is authoritative and matches the screen exports. |
| **LLM** | Gemini 2.5 Flash Lite via the official `@google/genai` SDK. Structured output enforced with **Zod** schemas + JSON response mode. |
| **Validation** | Zod for all agent I/O, API request/response, and env vars. |
| **Streaming** | Server-Sent Events (SSE) for the "agents working" progress screen. |
| **Testing** | Vitest (unit + integration, with a mocked Gemini client), Playwright (E2E). |
| **State/persistence (v1)** | Trips are stateless server-side; client persists saved trips to `localStorage`. No DB in v1 (accounts are a PRD "future" item). |
| **Package manager / structure** | Single Next.js app (not a monorepo) to keep it simple. Agent code lives in `src/lib/agents/`, shared domain types in `src/lib/types/`. |
| **Repo root** | The project lives directly in the working directory `Multi Agent Tool/`. Source under `app/` and `src/`. |
| **Node** | Node 20 LTS. |

### Target directory structure (built up over sprints)
```
/ (working dir)
├── app/                        # Next.js App Router (routes + pages)
│   ├── api/                    # Route handlers (Sprint 6)
│   ├── (screens)/              # UI routes (Sprints 7–9)
│   └── layout.tsx, globals.css
├── src/
│   ├── lib/
│   │   ├── agents/             # Orchestrator + 4 specialists + Review (Sprints 2–5)
│   │   ├── gemini/             # Gemini client wrapper, structured-output helper (Sprint 2)
│   │   ├── types/              # TripConstraints, TripState, Itinerary, etc. (Sprint 2)
│   │   ├── prompts/            # Prompt templates per agent (Sprints 3–5)
│   │   └── data/               # Sample/grounding data (Sprints 4–5)
│   └── components/             # Shared React UI components (Sprint 7+)
├── tests/                      # Vitest + Playwright
├── PRD_AI_Travel_Planner.md
├── ImplementationPlan.md       # THIS FILE — update every sprint
├── STARTING_PROMPTS.md
└── stitch_responsive_web_interface/   # design reference (do not ship as-is)
```

---

## 2. Sprint overview

| Sprint | Theme | Layer | Depends on |
|---|---|---|---|
| 1 | Scaffolding, tooling, design system | Foundation | — |
| 2 | Domain types + agent framework + Gemini client | Backend core | 1 |
| 3 | Orchestrator agent + constraint extraction | Backend | 2 |
| 4 | Destination Research + Logistics agents | Backend | 2,3 |
| 5 | Budget + Review agents + full pipeline | Backend | 2,3,4 |
| 6 | API layer + SSE streaming + caching/guardrails | Backend/API | 5 |
| 7 | Frontend foundation + Landing + Constraint screens | Frontend | 1,6 |
| 8 | Progress screen + Itinerary result screen | Frontend | 6,7 |
| 9 | Stay/Logistics + adjustment/edge + edit/export | Frontend | 6,7,8 |
| 10 | Hardening: E2E, a11y, perf, observability, deploy | Cross-cutting | all |

---

## SPRINT 1 — Scaffolding, tooling & design system foundation
**Status:** NOT STARTED
**Goal:** A running Next.js + TypeScript + Tailwind app whose Tailwind theme is the real design system, with linting, formatting, and the test harness wired. No product features yet.

**In scope**
- Initialize Next.js (App Router, TS strict). Confirm `npm run dev` and `npm run build` work.
- Port **all tokens** from `modern_editorial_voyager/DESIGN.md` into `tailwind.config.ts` (colors incl. `category-*` and `priority-*`, typography scale, `rounded`, spacing). Load Plus Jakarta Sans + Material Symbols Outlined.
- `globals.css` with base background `#faf9f7`, on-surface text, font defaults.
- Set up ESLint + Prettier, `tsconfig` paths (`@/*`).
- Install and configure Vitest (with a sample passing test) and Playwright (config only + one smoke test that the dev server renders).
- Add `.env.example` with `GEMINI_API_KEY=`.
- Create `README.md` (run instructions) and the empty directory skeleton from §1.
- Add `.gitignore`. `git init` the repo (working dir is not yet a git repo).

**Out of scope:** any agent logic, any real screens, any API routes.

**Files to create:** `package.json`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx` (placeholder), `app/globals.css`, `tsconfig.json`, `.eslintrc`, `.prettierrc`, `vitest.config.ts`, `playwright.config.ts`, `.env.example`, `README.md`, `.gitignore`.

**Acceptance criteria**
- [ ] `npm run build` succeeds with zero TS errors.
- [ ] `npm run lint` passes.
- [ ] `npm test` runs Vitest green (sample test).
- [ ] Tailwind exposes design tokens (e.g., a placeholder page using `bg-primary-container text-on-primary` and `font-[Plus_Jakarta_Sans]` renders correctly).
- [ ] Directory skeleton from §1 exists (empty folders with `.gitkeep` ok).

---

## SPRINT 2 — Domain types, agent framework & Gemini client
**Goal:** The typed backbone every agent uses: domain models, a reusable Gemini structured-output client (mockable), and a base agent abstraction. No real prompts/agents yet.

**In scope**
- Define Zod schemas + inferred TS types in `src/lib/types/`:
  - `TripConstraints` (destination, duration_days, cities[], budget_usd, currency, preferences[], avoidances[], travelers, pace, plus a `clarifications_needed[]` field).
  - `TripState` (constraints + per-agent outputs + draft itinerary + review result).
  - `ItineraryDay`, `ItineraryItem` (title, description, category enum `food|temple|experience|logistics`, priority enum `must-do|nice-to-have`, est_cost_usd, time_block enum `morning|afternoon|evening`).
  - `StayRecommendation`, `LogisticsLeg`, `BudgetBreakdown` (stay/transport/food/activities + total), `ReviewResult` (per-check `{check, status, reason, suggested_fix}` + overall pass/fail).
- `src/lib/gemini/client.ts`: wrapper around `@google/genai` that takes a Zod schema + prompt and returns validated, typed JSON. Built-in retry on malformed JSON (max 2), timeout, and token/cost logging hook. **Must be injectable/mockable** for tests.
- `src/lib/agents/base.ts`: a `BaseAgent` interface/abstract (`name`, `run(input): Promise<output>`), shared error handling, and a confidence/citation envelope type.
- Env validation module (`src/lib/env.ts`) parsing `GEMINI_API_KEY`.
- Vitest unit tests using a **mocked Gemini client** (no live API calls in tests).

**Out of scope:** actual agent prompts/behavior (Sprints 3–5), API routes, UI.

**Acceptance criteria**
- [ ] All schemas exported and unit-tested (valid + invalid cases).
- [ ] Gemini client returns typed data and retries on bad JSON (proven with a mock).
- [ ] `BaseAgent` abstraction documented with a doc comment example.
- [ ] `npm test` and `npm run build` green.

---

## SPRINT 3 — Orchestrator agent & constraint extraction
**Goal:** Turn a raw natural-language request into a validated `TripConstraints`, with clarifying-question detection. This is the entry point of the agent pipeline.

**In scope**
- `src/lib/prompts/orchestrator.ts`: extraction prompt (few-shot, using the PRD's Japan example) that outputs `TripConstraints` JSON matching the Zod schema.
- `src/lib/agents/orchestrator.ts`:
  - `extractConstraints(request: string): Promise<TripConstraints>`.
  - Low-confidence / ambiguity detection → populate `clarifications_needed[]` (e.g., missing budget or duration) per PRD edge cases.
  - Stub `synthesize()` method signature (full synthesis wired in Sprint 5) — leave a clear TODO + handover note.
- Tests with mocked Gemini covering: full request (Japan example), under-specified request (only "plan a trip to Japan"), conflicting constraints.

**Out of scope:** delegating to / synthesizing specialist outputs (Sprint 5), the parallel pipeline.

**Acceptance criteria**
- [ ] Japan example extracts all PRD constraints correctly (test asserts exact object).
- [ ] Under-specified request returns `clarifications_needed` instead of guessing.
- [ ] All tests + build green.

---

## SPRINT 4 — Destination Research & Logistics agents
**Goal:** The two "content" specialists, producing grounded recommendations and a feasible movement/stay plan.

**In scope**
- **Sample grounding data** in `src/lib/data/` for the seed destination (Japan: Tokyo + Kyoto): neighborhoods, temples, food areas, crowd/off-peak notes, inter-city transport (Shinkansen ~2h15m), sample hotel price ranges, intra-city travel-time estimates. Keep it as typed fixtures so agents are deterministic-testable. (Live web/maps APIs are a later/optional enhancement — note as out of scope here.)
- `src/lib/agents/destinationResearch.ts` + prompt: given `TripConstraints`, return recommended neighborhoods, temples, food streets, experiences, each tagged must-do/nice-to-have and crowd-level, preferring quiet/off-peak options when `avoidances` includes "crowds".
- `src/lib/agents/logistics.ts` + prompt: given `TripConstraints` (+ destination output if helpful), return `StayRecommendation[]` per city, `LogisticsLeg[]` (inter + intra city with durations), and a day-sequence skeleton that minimizes backtracking (e.g., 2 nights Tokyo / 2 Kyoto / 1 flexible).
- Tests (mocked Gemini + fixtures) asserting crowd-avoidance behavior and feasible sequencing.

**Out of scope:** budget math, review validation, final merge, live external APIs.

**Acceptance criteria**
- [ ] Destination agent returns preference-aligned, crowd-aware items for the Japan input.
- [ ] Logistics agent returns stay split + Shinkansen leg + non-backtracking sequence.
- [ ] Tests + build green.

---

## SPRINT 5 — Budget & Review agents + full pipeline assembly
**Goal:** Complete the backend brain: budget reconciliation, the quality gate, and the `Orchestrator → [Destination, Logistics, Budget in parallel] → Review → (loop)` pipeline producing a final validated itinerary.

**In scope**
- `src/lib/agents/budget.ts` + prompt: produce `BudgetBreakdown` (stay/transport/food/activities + total), flag overspend vs `budget_usd`, suggest cheaper alternatives (e.g., central Tokyo → Asakusa). Currency normalization.
- `src/lib/agents/review.ts` + prompt: run the PRD's 6 checks (fits duration, both cities, within budget, matches preferences, attempts crowd-avoidance, travel-time realistic) → `ReviewResult` with structured per-check feedback.
- `src/lib/agents/pipeline.ts` (the Orchestrator's full `synthesize`): run the 3 specialists **in parallel** (`Promise.all`), merge into a draft `ItineraryDay[]`, run Review; on fail, loop targeted re-plan with bounded retries (max 2) then deliver best-effort + caveats.
- Handle partial agent failure gracefully (deliver with caveats per PRD edge cases).
- Integration test: full Japan request → mocked-Gemini pipeline → validated 5-day itinerary, both cities, ≤ $3,000, food+temple tags present, review pass.

**Out of scope:** HTTP/API layer (Sprint 6), UI.

**Acceptance criteria**
- [ ] End-to-end (mocked) pipeline produces a Review-approved itinerary for the Japan example.
- [ ] Specialists run concurrently (assert parallelism, e.g., via timing/mock call order).
- [ ] Re-plan loop triggers on a forced review failure and is bounded.
- [ ] Infeasible-budget case returns best-effort + explicit caveat.
- [ ] Tests + build green.

---

## SPRINT 6 — API layer, SSE streaming, caching & guardrails
**Goal:** Expose the pipeline over HTTP with a clean contract the frontend can consume, including live progress streaming.

**In scope**
- Route handlers under `app/api/`:
  - `POST /api/parse` → returns `TripConstraints` (+ `clarifications_needed`).
  - `POST /api/plan` → SSE stream emitting agent progress events (`orchestrator|destination|logistics|budget|review` with `started|done` + status text) and a final `itinerary` event.
  - (Optional) `POST /api/regenerate-day` and `POST /api/cheaper` stubs for Sprint 9, or note as deferred.
- Zod request validation + structured error responses.
- **Guardrails:** reject non-travel / prompt-injection inputs; input length limits (PRD edge case).
- **Caching:** memoize destination research per (destination, preferences) to cut cost/latency (PRD risk mitigation).
- Cost/latency logging via the Sprint 2 hook.
- A documented **API contract** section appended to the handover (request/response/event shapes) for the frontend sprints.
- Tests: route handler tests with mocked pipeline; an SSE event-sequence test.

**Out of scope:** any React UI.

**Acceptance criteria**
- [ ] `POST /api/parse` returns correct constraints for the Japan example (integration test).
- [ ] `POST /api/plan` streams ordered progress events then a final itinerary.
- [ ] Off-topic/injection input is rejected with a clean error.
- [ ] API contract written into the handover.
- [ ] Tests + build green.

---

## SPRINT 7 — Frontend foundation + Landing & Constraint-Confirmation screens
**Goal:** Establish the shared React/Tailwind component library from the design exports, and ship the first two interactive screens wired to the API.

**Design references:** `stitch_responsive_web_interface/landing_page/`, `.../constraint_confirmation/`. Match tokens/typography exactly; **rebuild as React components, do not embed raw exported HTML**.

**In scope**
- Shared components in `src/components/`: `Button` (primary coral / secondary teal-ghost), `Chip`/`Tag`, `PriorityPill`, `Card`, `TopNav`, `Layout` container (1280px max, responsive margins). Use the design system's elevation/shape rules.
- **Landing screen** (`app/page.tsx`): hero, large NL input with the PRD placeholder, "Plan my trip" CTA, example-prompt chips, 3-step "how it works" row, top nav.
- **Constraint-confirmation screen**: on submit, call `POST /api/parse`, render the parsed summary with editable chips, "Looks right — build my plan" CTA. Handle `clarifications_needed` by prompting the user.
- Client routing/state to carry constraints into the plan step.
- Component tests (Vitest + Testing Library) and Playwright happy-path for landing → confirmation.

**Out of scope:** the progress + itinerary screens (Sprint 8).

**Acceptance criteria**
- [ ] Landing and confirmation screens match the design exports (layout, colors, type) and are responsive (desktop + mobile).
- [ ] Submitting the Japan sentence calls `/api/parse` and shows correct editable constraints.
- [ ] Clarification flow renders when constraints are incomplete.
- [ ] Component tests + Playwright path + build green.

---

## SPRINT 8 — Agents-working (progress) screen + Itinerary result screen
**Goal:** The centerpiece. Consume the SSE stream to animate the multi-agent progress, then render the full validated itinerary.

**Design references:** `.../ai_planning_in_progress/`, `.../your_itinerary/`.

**In scope**
- **Progress screen:** consume `POST /api/plan` SSE; visualize Orchestrator + the 3 parallel specialists feeding Review, lighting up with checkmarks and live status text.
- **Itinerary result screen (hero):**
  - Main column: day cards with morning/afternoon/evening blocks; each item shows title, description, category tag (food/temple/experience colors), must-do/nice-to-have pill, est. cost; per-day "Regenerate this day" / "Make it cheaper" buttons (wired to stubs/handlers).
  - Sticky sidebar: Review **compliance badge card** (green checks), **budget breakdown** (bars: stay/transport/food/activities + "Estimated total $X of $Y"), **stay & logistics** summary.
  - Header: trip title, dates, Export/Share/Save buttons (Save → localStorage; Export/Share can be stubbed for Sprint 9).
- Loading/skeleton + error states.
- Component tests + Playwright: full landing → plan → itinerary render against a mocked/seeded backend.

**Out of scope:** stay-detail screen, adjustment/edge screen, real export/share (Sprint 9).

**Acceptance criteria**
- [ ] Progress screen reflects real SSE events in order with completion states.
- [ ] Itinerary screen renders a complete 5-day Japan plan matching the design, with correct tags/pills/costs.
- [ ] Sidebar compliance + budget + logistics cards populate from API data.
- [ ] E2E happy path green; build green.

---

## SPRINT 9 — Stay/Logistics detail, adjustment/edge state, edit & export flows
**Goal:** Complete the remaining screens and the key interactions that make the plan usable and editable.

**Design references:** `.../stay_logistics_details/`, `.../request_adjustment/`.

**In scope**
- **Stay & logistics detail screen:** neighborhood cards (photo, name, "why this area" rationale, price range, map placeholder), inter-city transport card (Shinkansen duration + est. cost + "Book" deep-link button — link out, no transaction per PRD non-goals).
- **Request-adjustment / infeasible edge screen:** friendly state for infeasible requests (e.g., "$300 won't cover 5 days in Japan…") with suggested adjustments that re-trigger planning.
- **Edit/regenerate flows:** wire "Regenerate this day", "Make it cheaper", and chip-editing to `/api/regenerate-day` & `/api/cheaper` (implement these handlers now if deferred in Sprint 6).
- **Export/Share/Save:** PDF or print-export, shareable link (serialized plan), and localStorage Save + a basic "my trips" list.
- Tests for each new screen + the edit/regenerate round-trip.

**Out of scope:** accounts/DB, real booking, collaboration (PRD future).

**Acceptance criteria**
- [ ] Stay/logistics and adjustment screens match designs and are responsive.
- [ ] "Make it cheaper" / "Regenerate this day" update the itinerary via API.
- [ ] Export, Share link, and Save (localStorage) all work end-to-end.
- [ ] Infeasible request routes to the adjustment screen with suggestions.
- [ ] Tests + build green.

---

## SPRINT 10 — Hardening: E2E, accessibility, performance, observability & deploy
**Goal:** Make it production-credible against the PRD's success and guardrail metrics. No new features.

**In scope**
- **E2E suite:** full Playwright journeys (happy path, clarification path, infeasible path, edit path).
- **Accessibility:** keyboard nav, focus states, ARIA, contrast audit (design already targets accessible contrast); fix violations.
- **Performance:** measure time-to-first-itinerary (PRD target P50 ≤ 30s); add caching/parallelism tuning; lazy-load images; lighthouse pass.
- **Guardrails & observability:** finalize prompt-injection/off-topic rejection; add structured logging + a **cost-per-plan** and **latency** metric surface (PRD guardrails: cost ≤ ~$0.15/plan, hallucination spot-audit hook).
- **Resilience:** verify graceful degradation on agent timeout/partial failure end-to-end.
- **Deploy config:** production build, env handling, `vercel.json` or Dockerfile, deployment instructions in README.
- **Docs:** finalize README (architecture diagram, agent flow, how to run/test/deploy) and a short `ARCHITECTURE.md`.

**Out of scope:** new product features; live external travel APIs (note as the top future enhancement).

**Acceptance criteria**
- [ ] Full E2E suite green in CI-style run.
- [ ] No critical a11y violations; lighthouse a11y ≥ 90.
- [ ] Cost + latency metrics emitted and documented; P50 latency measured and recorded.
- [ ] Injection/off-topic and timeout/partial-failure paths verified.
- [ ] Production build + deploy instructions verified; docs complete.

---

## 3. Current State Snapshot
*Update this table at the end of every sprint.*

| Capability | Status | Notes |
|---|---|---|
| Project scaffold / tooling | ⬜ Not started | |
| Design tokens in Tailwind | ⬜ Not started | |
| Domain types + Zod schemas | ⬜ Not started | |
| Gemini client (mockable) | ⬜ Not started | |
| Orchestrator / constraint extraction | ⬜ Not started | |
| Destination Research agent | ⬜ Not started | |
| Logistics agent | ⬜ Not started | |
| Budget agent | ⬜ Not started | |
| Review agent | ⬜ Not started | |
| Full pipeline (parallel + review loop) | ⬜ Not started | |
| API + SSE | ⬜ Not started | |
| Landing + Constraint screens | ⬜ Not started | |
| Progress + Itinerary screens | ⬜ Not started | |
| Stay/Logistics + adjustment + edit/export | ⬜ Not started | |
| Hardening / deploy | ⬜ Not started | |

Legend: ⬜ Not started · 🟡 In progress/partial · ✅ Done

---

## 4. Progress Log & Handover
*Each sprint appends its entry here at completion. This is the primary handover to the next Claude Code session. Be concrete: real file paths, real commands, real test output, and the single most important thing the next sprint must check first.*

### Sprint 1 — Scaffolding & design system
- **Status:** _pending_
- **What was built:** _…_
- **Key files:** _…_
- **Decisions / deviations from plan:** _…_
- **Known issues / TODOs for later sprints:** _…_
- **Verification (commands + result):** _…_
- **First thing Sprint 2 should verify:** _…_

### Sprint 2 — Domain types, agent framework & Gemini client
- _pending_

### Sprint 3 — Orchestrator & constraint extraction
- _pending_

### Sprint 4 — Destination Research & Logistics agents
- _pending_

### Sprint 5 — Budget & Review agents + pipeline
- _pending_

### Sprint 6 — API layer, SSE, guardrails
- _pending_

### Sprint 7 — Frontend foundation + Landing & Constraint screens
- _pending_

### Sprint 8 — Progress + Itinerary screens
- _pending_

### Sprint 9 — Stay/Logistics + adjustment + edit/export
- _pending_

### Sprint 10 — Hardening & deploy
- _pending_
