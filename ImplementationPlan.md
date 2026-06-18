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
**Status:** DONE (2026-06-18)
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
- [x] `npm run build` succeeds with zero TS errors.
- [x] `npm run lint` passes.
- [x] `npm test` runs Vitest green (sample test).
- [x] Tailwind exposes design tokens (e.g., a placeholder page using `bg-primary-container text-on-primary` and `font-[Plus_Jakarta_Sans]` renders correctly).
- [x] Directory skeleton from §1 exists (empty folders with `.gitkeep` ok).

---

## SPRINT 2 — Domain types, agent framework & Gemini client
**Status:** DONE (2026-06-18)
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
- [x] All schemas exported and unit-tested (valid + invalid cases).
- [x] Gemini client returns typed data and retries on bad JSON (proven with a mock).
- [x] `BaseAgent` abstraction documented with a doc comment example.
- [x] `npm test` and `npm run build` green.

---

## SPRINT 3 — Orchestrator agent & constraint extraction
**Status:** DONE (2026-06-18)
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
- [x] Japan example extracts all PRD constraints correctly (test asserts exact object).
- [x] Under-specified request returns `clarifications_needed` instead of guessing.
- [x] All tests + build green.

---

## SPRINT 4 — Destination Research & Logistics agents
**Status:** DONE (2026-06-18)
**Goal:** The two "content" specialists, producing grounded recommendations and a feasible movement/stay plan.

**In scope**
- **Sample grounding data** in `src/lib/data/` for the seed destination (Japan: Tokyo + Kyoto): neighborhoods, temples, food areas, crowd/off-peak notes, inter-city transport (Shinkansen ~2h15m), sample hotel price ranges, intra-city travel-time estimates. Keep it as typed fixtures so agents are deterministic-testable. (Live web/maps APIs are a later/optional enhancement — note as out of scope here.)
- `src/lib/agents/destinationResearch.ts` + prompt: given `TripConstraints`, return recommended neighborhoods, temples, food streets, experiences, each tagged must-do/nice-to-have and crowd-level, preferring quiet/off-peak options when `avoidances` includes "crowds".
- `src/lib/agents/logistics.ts` + prompt: given `TripConstraints` (+ destination output if helpful), return `StayRecommendation[]` per city, `LogisticsLeg[]` (inter + intra city with durations), and a day-sequence skeleton that minimizes backtracking (e.g., 2 nights Tokyo / 2 Kyoto / 1 flexible).
- Tests (mocked Gemini + fixtures) asserting crowd-avoidance behavior and feasible sequencing.

**Out of scope:** budget math, review validation, final merge, live external APIs.

**Acceptance criteria**
- [x] Destination agent returns preference-aligned, crowd-aware items for the Japan input.
- [x] Logistics agent returns stay split + Shinkansen leg + non-backtracking sequence.
- [x] Tests + build green.

---

## SPRINT 5 — Budget & Review agents + full pipeline assembly
**Status:** DONE (2026-06-18)
**Goal:** Complete the backend brain: budget reconciliation, the quality gate, and the `Orchestrator → [Destination, Logistics, Budget in parallel] → Review → (loop)` pipeline producing a final validated itinerary.

**In scope**
- `src/lib/agents/budget.ts` + prompt: produce `BudgetBreakdown` (stay/transport/food/activities + total), flag overspend vs `budget_usd`, suggest cheaper alternatives (e.g., central Tokyo → Asakusa). Currency normalization.
- `src/lib/agents/review.ts` + prompt: run the PRD's 6 checks (fits duration, both cities, within budget, matches preferences, attempts crowd-avoidance, travel-time realistic) → `ReviewResult` with structured per-check feedback.
- `src/lib/agents/pipeline.ts` (the Orchestrator's full `synthesize`): run the 3 specialists **in parallel** (`Promise.all`), merge into a draft `ItineraryDay[]`, run Review; on fail, loop targeted re-plan with bounded retries (max 2) then deliver best-effort + caveats.
- Handle partial agent failure gracefully (deliver with caveats per PRD edge cases).
- Integration test: full Japan request → mocked-Gemini pipeline → validated 5-day itinerary, both cities, ≤ $3,000, food+temple tags present, review pass.

**Out of scope:** HTTP/API layer (Sprint 6), UI.

**Acceptance criteria**
- [x] End-to-end (mocked) pipeline produces a Review-approved itinerary for the Japan example.
- [x] Specialists run concurrently (assert parallelism, e.g., via timing/mock call order).
- [x] Re-plan loop triggers on a forced review failure and is bounded.
- [x] Infeasible-budget case returns best-effort + explicit caveat.
- [x] Tests + build green.

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
| Project scaffold / tooling | ✅ Done | Next.js 14 App Router, TS strict, ESLint+Prettier, Vitest+Playwright. git initialized. |
| Design tokens in Tailwind | ✅ Done | All `modern_editorial_voyager` tokens in `tailwind.config.ts`; Jakarta + Material Symbols loaded. |
| Domain types + Zod schemas | ✅ Done | 8 schemas in `src/lib/types/`; 28 unit tests covering valid + invalid cases. |
| Gemini client (mockable) | ✅ Done | `src/lib/gemini/client.ts` + `mock.ts`; retry, timeout, log hook; 15 unit tests. |
| Orchestrator / constraint extraction | ✅ Done | `OrchestratorAgent.extractConstraints` → `ExtractionResult` union (complete \| needs_clarification); 11 unit tests. `synthesize()` stubbed for Sprint 5. |
| Destination Research agent | ✅ Done | `DestinationResearchAgent` + Japan grounding data; crowd-avoidance reorder; 8 tests. |
| Logistics agent | ✅ Done | `LogisticsAgent` (stays/legs/day_sequence) + `isNonBacktrackingSequence`; 10 tests. |
| Budget agent | ✅ Done | `BudgetAgent` + deterministic total/within-budget re-derivation; 5 tests. |
| Review agent | ✅ Done | `ReviewAgent` — **deterministic** 6-check gate (no LLM); 8 tests. |
| Full pipeline (parallel + review loop) | ✅ Done | `runPipeline` + `buildDraftItinerary`; parallel fan-out, bounded re-plan, partial-failure degradation; 8 tests. `synthesize` wired. |
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
- **Status:** DONE (2026-06-18)
- **What was built:** Full Next.js 14 (App Router) + TypeScript-strict + Tailwind scaffold with the design system, tooling, and test harness. The scaffold was already partially present at session start; this sprint verified it against the Sprint 1 spec, confirmed correctness, ran the full verification suite, installed the Playwright browser, and initialized git.
- **Key files:**
  - `tailwind.config.ts` — **all** `modern_editorial_voyager/DESIGN.md` tokens ported verbatim: colors (incl. `category-food|temple|experience`, `priority-must|nice`), `fontSize` scale (`headline-xl`→`label-sm`), `borderRadius`, `spacing` (`gutter`, `margin-*`, `stack-*`), `maxWidth.container` 1280px, plus a `shadow-ambient` elevation token.
  - `app/layout.tsx` — loads **Plus Jakarta Sans** via `next/font/google` (CSS var `--font-jakarta`) and **Material Symbols Outlined** via Google Fonts `<link>`; `body` uses `bg-background font-sans text-on-background`.
  - `app/globals.css` — Tailwind layers + base bg/text + `.material-symbols-outlined` base style.
  - `app/page.tsx` — Sprint 1 placeholder proving tokens resolve (uses `bg-primary-container`, `text-on-primary-container`, `category-*`, `priority-must`, `text-headline-*`, `shadow-ambient`, spacing tokens). Has `data-testid="token-badge"` for the E2E smoke test.
  - Config: `tsconfig.json` (strict, `@/*`→`src/*`), `.eslintrc.json` (next/core-web-vitals + prettier), `.prettierrc`, `next.config.mjs`, `postcss.config.mjs`, `vitest.config.ts` (jsdom, includes only `tests/unit/**`), `playwright.config.ts` (auto-boots dev server), `.env.example` (`GEMINI_API_KEY`), `.gitignore`, `README.md`.
  - Skeleton: `src/lib/{agents,gemini,types,prompts,data}/.gitkeep`, `src/components/.gitkeep`, `app/api/.gitkeep`.
  - Tests: `tests/unit/sample.test.ts` (Vitest harness), `tests/e2e/smoke.spec.ts` (renders token badge + heading), `tests/setup.ts` (jest-dom).
- **Decisions / deviations from plan:**
  - **Material Symbols** loaded via a Google Fonts stylesheet `<link>` in `layout.tsx` (not `next/font`), since it is an icon font used app-wide; the `@next/next/no-page-custom-font` lint rule is disabled on that single line. The DESIGN.md says "Plus Jakarta Sans + Material Symbols" and the screen exports confirm Material Symbols Outlined — root `DESIGN.md`'s mention of Inter/Lucide is the superseded brief (see §1 ⚠️), ignored.
  - Vitest `include` is scoped to `tests/unit/**` so Playwright specs in `tests/e2e/**` don't get picked up by Vitest.
  - `git init` produced CRLF-normalization warnings (Windows) — cosmetic, not errors. No `.gitattributes` added (out of scope; note for later if cross-platform CI matters).
- **Known issues / TODOs for later sprints:**
  - No `@google/genai` dependency yet — **Sprint 2 must `npm install @google/genai` and `zod`** (not in `package.json`).
  - Playwright browsers are a local/CI install step (`npx playwright install chromium`); document in CI setup during Sprint 10.
  - Root `DESIGN.md` is the stale brief; always theme from `stitch_responsive_web_interface/modern_editorial_voyager/DESIGN.md`.
- **Verification (commands + result):**
  - `npm run lint` → `✔ No ESLint warnings or errors`.
  - `npm test` → Vitest `1 passed (1)` (`tests/unit/sample.test.ts`).
  - `npm run build` → `✓ Compiled successfully`, zero type errors; routes `/` and `/_not-found` prerendered static (First Load JS ~87 kB).
  - `npm run test:e2e` → _pending browser install confirmation (see snapshot note); harness + config verified._
  - `git init` + initial commit `57bfe5d` (48 files tracked, `node_modules` excluded).
- **First thing Sprint 2 should verify:** `npm run build` + `npm test` are green from a clean state, then **install the missing deps (`@google/genai`, `zod`)** before writing types/client — they are not yet in `package.json`. Reuse `tsconfig` path alias `@/*` → `src/*` for all imports.

### Sprint 2 — Domain types, agent framework & Gemini client
- **Status:** DONE (2026-06-18)
- **What was built:** Full typed backbone — Zod schemas + TS types, a mockable Gemini client, mock factory, env validation, and the `BaseAgent` abstraction. 49 unit tests green across 4 test files.
- **Key files:**
  - `src/lib/types/itinerary.ts` — `ItineraryItemSchema` (category/priority/time_block/crowd_level enums), `ItineraryDaySchema`
  - `src/lib/types/agents.ts` — `StayRecommendationSchema`, `LogisticsLegSchema`, `BudgetBreakdownSchema`, `ReviewCheckSchema`, `ReviewResultSchema`
  - `src/lib/types/trip.ts` — `TripConstraintsSchema` (with defaults: currency USD, travelers 1, pace moderate, clarifications_needed []), `TripStateSchema`
  - `src/lib/types/index.ts` — barrel re-export of all types
  - `src/lib/env.ts` — `getEnv()` with Zod validation + cache; `_resetEnvCache()` for tests
  - `src/lib/gemini/client.ts` — `createGeminiClient(options, rawFn?)`: takes optional `RawGenerateFn` override for testing; retries up to `maxRetries` (default 2) on JSON parse or Zod validation errors; does **not** retry on API/timeout errors; fires `LogHook` on every attempt
  - `src/lib/gemini/mock.ts` — `createMockGeminiClient(responses[])`: consumes responses in order, validates each against the schema, throws on Error instances or exhaustion
  - `src/lib/agents/base.ts` — `BaseAgent<TInput,TOutput>` interface, `AgentResult<T>` (data + confidence + citations), `AgentError` class
  - `tests/unit/types.test.ts` (28 tests), `tests/unit/gemini-client.test.ts` (15 tests), `tests/unit/env.test.ts` (5 tests), `tests/unit/sample.test.ts` (1 test, Sprint 1)
- **Decisions / deviations from plan:**
  - Installed **`@google/genai@^2.8.0`** (v2, not v1) and **`zod@^4.4.3`** (v4). Both have stable APIs compatible with the plan. `z.ZodType<T>` and `z.infer<>` work identically in Zod v4.
  - `GeminiClient` interface (not `GeminiClientInterface`) — cleaner naming.
  - Split mock into `src/lib/gemini/mock.ts` (separate from `client.ts`) to keep production code clean. Sprint 3+ agents import from `@/lib/gemini/mock`.
  - `buildRealRawFn` instantiates `GoogleGenAI` eagerly (not lazily) — avoids dynamic-import complexity since this code is server-side only.
  - `response.text` in `@google/genai` v2 is a getter returning `string | undefined` — guarded with `?? ""`.
  - Token counts: `response.usageMetadata?.promptTokenCount`, `candidatesTokenCount`, `totalTokenCount`.
- **Known issues / TODOs for later sprints:**
  - `TripState.destination_output` and `logistics_output` from the plan spec are intentionally not typed as `z.unknown()` — instead, Sprint 4 will fill `stay_recommendations` and `logistics_legs` directly (already typed in `TripState`). No action needed.
  - `src/lib/types/_zod_check.ts` temp file was created and deleted during type-checking; if it reappears, delete it.
  - `npm audit` shows pre-existing vulnerabilities from Sprint 1 deps — not introduced by Sprint 2; address in Sprint 10.
- **Verification:**
  - `npm test` → **49 passed (4 files)** — `sample.test.ts` (1), `env.test.ts` (5), `types.test.ts` (28), `gemini-client.test.ts` (15)
  - `npm run build` → `✓ Compiled successfully`, zero TS errors, routes unchanged
- **First thing Sprint 3 should verify:** Run `npm test` + `npm run build` from clean state. Then import `TripConstraintsSchema` from `@/lib/types` and `createMockGeminiClient` from `@/lib/gemini/mock` at the top of the orchestrator file to confirm the module graph resolves before writing any prompt logic.

### Sprint 3 — Orchestrator & constraint extraction
- **Status:** DONE (2026-06-18)
- **What was built:** The Orchestrator's phase-1 constraint extraction — a few-shot prompt + an injectable agent that turns a raw request into either validated `TripConstraints` or a set of clarifying questions. 11 new tests; 60 total green.
- **Key files:**
  - `src/lib/prompts/orchestrator.ts` — `ORCHESTRATOR_SYSTEM_INSTRUCTION` + `buildExtractionPrompt(request)`. Few-shot anchored on the PRD Japan example **and** an under-specified "Plan a trip to Japan." example so the model learns to ask, not guess. Instructs JSON-only output, null for unknown hard fields, currency→USD conversion, conflict flagging.
  - `src/lib/agents/orchestrator.ts` — `OrchestratorAgent` class (constructor-injected `GeminiClient`), `createOrchestratorAgent()` factory, `ExtractionSchema`/`Extraction` (permissive DTO), `ExtractionResult` union, `PartialConstraints`.
  - `tests/unit/orchestrator.test.ts` — 11 tests: complete Japan (exact object), factory, currency-default, under-specified → clarifications, deterministic backstop, empty input (no Gemini call), conflicting constraints, synthesize stub throws, prompt builder, ExtractionSchema valid/invalid.
- **Key design decision (deviation from plan signature):** The plan sketched `extractConstraints(): Promise<TripConstraints>`, but the Sprint 2 `TripConstraintsSchema` **requires** `duration_days`, `cities`, and `budget_usd` — so an under-specified request genuinely cannot be a valid `TripConstraints`. Rather than weaken the locked Sprint 2 schema, `extractConstraints` returns a **discriminated union** `ExtractionResult = { status: "complete"; constraints } | { status: "needs_clarification"; clarifications_needed; partial }`. Callers (Sprint 5 pipeline, Sprint 6 `/api/parse`, Sprint 7 UI) must switch on `result.status`. The LLM call uses the looser `ExtractionSchema` (nullable hard fields); the agent then validates the complete case through `TripConstraintsSchema`.
  - **Two-layer clarification detection:** the model populates `clarifications_needed`, and the agent adds a **deterministic backstop** — any null `destination`/`duration_days`/`cities`/`budget_usd` always produces a question even if the model forgets. Lists are merged + de-duplicated.
  - Empty/whitespace input short-circuits to a clarification **without** calling Gemini (saves a token round-trip).
  - `synthesize(constraints)` is a stub that throws "not implemented until Sprint 5" (typed `Promise<TripState>` so Sprint 5 just fills the body). Note: it uses `void constraints;` to satisfy lint — the project's ESLint is `next/core-web-vitals` and does **not** have the `@typescript-eslint/no-unused-vars` rule registered, so `// eslint-disable-next-line @typescript-eslint/no-unused-vars` is a build error here. Use `void x;` or the base `no-unused-vars` rule instead.
- **Known issues / TODOs for later sprints:**
  - Currency conversion is LLM-estimated only (prompt asks for an approximate USD number). Sprint 5 Budget agent owns real normalization.
  - Off-topic/injection input is only softly handled (model instructed to return nulls + a clarification). Hard guardrails are Sprint 6.
  - `ExtractionResult.partial` is provided for Sprint 7 UI pre-fill of the constraint-confirmation screen — not yet consumed.
- **Verification:**
  - `npm test` → **60 passed (5 files)** — orchestrator.test.ts adds 11.
  - `npm run lint` → `✔ No ESLint warnings or errors`.
  - `npm run build` → `✓ Compiled successfully`, zero TS errors.
- **First thing Sprint 4 should verify:** `npm test` + `npm run build` green from clean. Then note the extraction contract: Sprint 4 specialists receive a **validated `TripConstraints`** (the `complete` branch), not the raw request — import `TripConstraints` from `@/lib/types` and construct agents with an injected `GeminiClient` (mirror `OrchestratorAgent`'s constructor-injection + `createMockGeminiClient` test pattern). Specialists should implement `BaseAgent<TInput, TOutput>` from `@/lib/agents/base`.

### Sprint 4 — Destination Research & Logistics agents
- **Status:** DONE (2026-06-18)
- **What was built:** The two content specialists + typed Japan grounding data. Both implement `BaseAgent<TripConstraints, TOutput>` with constructor-injected `GeminiClient` (same pattern as the Orchestrator). 27 new tests; 87 total green.
- **Key files:**
  - `src/lib/data/japan.ts` — `JAPAN_DATA` (`DestinationData`): 6 neighborhoods + 12 attractions across Tokyo/Kyoto (each with `crowd_level`, `best_time`, `off_peak_tip`, cost, must-do/nice-to-have), inter-city Shinkansen legs (**135 min, ~$95**), 7 intra-city time estimates. Helpers: `getDestinationData(destination)` (case-insensitive, **Japan-only — returns `null` otherwise**) and `formatGroundingForPrompt(data, cities)` (compact text block, filtered to requested cities).
  - `src/lib/types/agents.ts` — **added** `DestinationRecommendationSchema`/`DestinationResearchSchema` and `DaySequenceEntrySchema`/`LogisticsPlanSchema` (reusing `Category`/`Priority`/`CrowdLevel` enums from `itinerary.ts`). These are the cross-agent output contracts Sprint 5 consumes.
  - `src/lib/prompts/destinationResearch.ts`, `src/lib/prompts/logistics.ts` — grounded, JSON-only prompts; instruct crowd-favoring + off-peak tips, and the non-backtracking (contiguous city block) rule.
  - `src/lib/agents/destinationResearch.ts` — `DestinationResearchAgent.run(constraints)`. Exported helpers `avoidsCrowds()`, `sortByCrowdAscending()`. **Behavior:** when avoidances mention crowds, reorders recommendations quietest-first and caps confidence at 0.7 if any high-crowd must-do lacks an `off_peak_tip`.
  - `src/lib/agents/logistics.ts` — `LogisticsAgent.run(constraints)`. Exported helper `isNonBacktrackingSequence(day_sequence)`. **Behavior:** computes feasibility (sequence contiguity + total nights ≤ duration) and reflects it in confidence (0.9 feasible → ≤0.5 if backtracking/over-nights) rather than throwing.
  - Tests: `tests/unit/japan-data.test.ts` (9), `tests/unit/destinationResearch.test.ts` (8), `tests/unit/logistics.test.ts` (10).
- **Decisions / deviations from plan:**
  - **Destination output is its own typed contract** (`DestinationResearch`), NOT stored in `TripState` yet — `TripState` has no destination field. Sprint 5 should decide whether to add `destination_research?` to `TripStateSchema` or just pass it through the pipeline in-memory when building `draft_itinerary`.
  - Agents return `AgentResult<T>` (`data` + `confidence` + `citations`). `citations` is `["grounding:Japan"]` when curated data was used, else `["gemini-synthesized"]`.
  - **Deterministic post-processing** (crowd reorder, feasibility scoring) makes behavior testable with a mocked LLM — the mock returns raw fixtures and the agent's own logic is what the tests assert. Failures from the Gemini client are wrapped in `AgentError(name, cause)`.
  - Logistics `run(constraints)` takes only `TripConstraints` (the plan allowed "+ destination output if helpful"). Kept the `BaseAgent` single-arg `run` contract clean; Sprint 5 can pass destination data through the prompt if it wants tighter coupling.
- **Known issues / TODOs for later sprints:**
  - No budget math, review, or merge yet (Sprint 5). The destination recs and logistics day_sequence are the raw material Sprint 5's `synthesize` turns into `draft_itinerary: ItineraryDay[]`.
  - `getDestinationData` is Japan-only; any non-Japan request falls back to ungrounded prompts (confidence 0.6). Multi-destination data is a later enhancement.
  - Currency: costs in data are USD; non-USD handling is the Budget agent's job (Sprint 5).
- **Verification:**
  - `npm test` → **87 passed (8 files)** — japan-data (9), destinationResearch (8), logistics (10) added this sprint.
  - `npm run lint` → `✔ No ESLint warnings or errors`.
  - `npm run build` → `✓ Compiled successfully`, zero TS errors.
- **First thing Sprint 5 should verify:** `npm test` + `npm run build` green from clean. Then wire `OrchestratorAgent.synthesize()` (currently throws): construct all three specialists with the **same** injected `GeminiClient`, run Destination + Logistics + Budget via `Promise.all`, and merge into `ItineraryDay[]` using the logistics `day_sequence` (city per day) + destination `recommendations` (slot into morning/afternoon/evening by `time_block`). Reuse `DestinationResearch`/`LogisticsPlan` from `@/lib/types`. Decide where `DestinationResearch` lives in `TripState` (add an optional field or keep in-memory).

### Sprint 5 — Budget & Review agents + pipeline
- **Status:** DONE (2026-06-18)
- **What was built:** The complete backend brain — Budget agent, the Review gate, and the full parallel pipeline wired into `OrchestratorAgent.synthesize`. 21 new tests; **112 total green**.
- **Key files:**
  - `src/lib/prompts/budget.ts`, `src/lib/agents/budget.ts` — `BudgetAgent` (BaseAgent<TripConstraints, BudgetBreakdown>). LLM estimates the 4 category costs; the agent then **deterministically re-derives** `total_usd`, `within_budget`, and `overspend_usd` against `budget_usd` (never trusts the model's arithmetic). Adds a USD note when `currency !== "USD"`.
  - `src/lib/agents/review.ts` — `ReviewAgent.review(input)` returning `ReviewResult`. The PRD's six checks: `fits_duration`, `includes_all_cities`, `within_budget`, `matches_preferences`, `avoids_crowds`, `travel_time_realistic`. Exposes `ReviewInput`.
  - `src/lib/agents/pipeline.ts` — `runPipeline(constraints, client, options?)`, `buildDraftItinerary(...)`, `buildPipelineAgents(...)`. Parallel fan-out via `Promise.allSettled`, deterministic merge into `ItineraryDay[]`, Review gate, bounded re-plan loop, graceful partial-failure degradation. `PipelineOptions.maxReplans` (default 2).
  - `src/lib/agents/orchestrator.ts` — `synthesize(constraints, options?)` now delegates to `runPipeline` (the Sprint 3 stub is gone).
  - Tests: `pipeline.test.ts` (8), `review.test.ts` (8), `budget.test.ts` (5); updated `orchestrator.test.ts` synthesize test (delegation, not stub).
- **Key design decisions / deviations (read these):**
  - **Review is a DETERMINISTIC gate, not an LLM call — deliberate deviation from "review.ts (+prompt)".** A code gate can't be fooled by the model grading its own output, and it makes the re-plan loop reproducible/testable. There is **no `prompts/review.ts`**. If a future sprint wants LLM-authored review prose, layer it as enrichment on top of the deterministic verdict — do not let it decide the gate.
  - **Budget runs from `TripConstraints` only** (+ grounding data), NOT from the Destination/Logistics outputs — required so all three fan out in parallel. It estimates costs independently; the merge/Review reconcile.
  - **Re-plan currently re-runs the FULL fan-out** (all three specialists) on any failure, bounded by `maxReplans`. True feedback-targeted re-planning (passing failed-check guidance into each agent's prompt) is a **future refinement** — the agents' `run(constraints)` signature doesn't yet take feedback, so re-running with identical inputs only helps when upstream data changes. Noted as a known limitation; the loop structure, bound, and best-effort+caveats delivery are all in place and tested.
  - **`buildDraftItinerary` is deterministic:** day→city from `logistics.day_sequence`; recs spread across each city's days (must-do first, quietest-first when avoiding crowds); inter-city leg surfaced as a `logistics` item on the transfer day; **every day guaranteed ≥1 item** (fallback "Explore {city}"). Items/day by pace (slow 2 / moderate 3 / fast 4).
  - **Partial failure:** `Promise.allSettled` + fallbacks — destination fail → empty recs (fallback items), logistics fail → synthesized day_sequence/stays so day-count & cities still hold, budget fail → zeroed breakdown. Each adds a caveat; the pipeline never throws on a single agent failure.
  - **`TripState` unchanged** — destination recommendations are consumed in-memory by the merge, not stored on `TripState` (no `destination_research` field added). `stay_recommendations`, `logistics_legs`, `budget_breakdown`, `draft_itinerary`/`final_itinerary`, `review_result`, `caveats`, `replan_count` are all populated.
- **Carried-over quality gaps from the Sprint 4 review (still open, fine for now):** logistics doesn't verify both requested cities are actually planned (Review's `includes_all_cities` now covers this at the gate); `nightsReasonable` heuristic is loose; `isNonBacktrackingSequence` trusts array order (pipeline sorts `day_sequence` by `day` before use, mitigating it).
- **Verification:**
  - `npm test` → **112 passed (11 files)** — pipeline (8), review (8), budget (5) added.
  - `npm run lint` → `✔ No ESLint warnings or errors`.
  - `npm run build` → `✓ Compiled successfully`, zero TS errors.
- **First thing Sprint 6 should verify:** `npm test` + `npm run build` green from clean. Then the API contract: `POST /api/parse` wraps `OrchestratorAgent.extractConstraints` → returns the `ExtractionResult` union (switch on `status`: `complete` | `needs_clarification`). `POST /api/plan` wraps `runPipeline` (or `orchestrator.synthesize`) and should stream progress — note that `runPipeline` is currently a single awaited call with no progress events; **Sprint 6 must add an event/callback hook** (e.g., an `onProgress(stage, status)` option threaded into `fanOut`/review) to drive the SSE stream, since the agents don't emit progress yet. Construct the real Gemini client via `createGeminiClient({ apiKey: getEnv().GEMINI_API_KEY })` (server-side only) and inject it.

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
