# Starting Prompts — AI Travel Planner (10 sequential Claude Code sessions)

Each block below is the **first message** to paste into a fresh Claude Code session for that sprint. Run them **in order** — each assumes the previous sprint finished and updated `ImplementationPlan.md`.

**Working directory for every session:** `C:\Users\thaku\Downloads\Multi Agent Tool`

> Common rule baked into every prompt: read the plan + the previous handover, do only this sprint, then update `ImplementationPlan.md` (checkboxes, status, snapshot table, and the handover entry) before finishing.

---

## Sprint 1

```
You are running SPRINT 1 of a 10-sprint build. Working dir: the current folder.

First, read `ImplementationPlan.md` in full — especially §0 (how to use), §1 (locked technical decisions), and the "SPRINT 1" section. Also skim `PRD_AI_Travel_Planner.md` for product context and `stitch_responsive_web_interface/modern_editorial_voyager/DESIGN.md` for the design tokens.

Then execute ONLY Sprint 1: scaffold a Next.js (App Router, TypeScript strict) + Tailwind app; port the DESIGN.md tokens (colors incl. category-*/priority-*, typography, rounded, spacing) into tailwind.config.ts; load Plus Jakarta Sans + Material Symbols; set up ESLint/Prettier, Vitest (one passing test), Playwright (config + smoke test), .env.example with GEMINI_API_KEY, README, .gitignore, git init, and the directory skeleton from §1.

Do NOT build any agents, API routes, or product screens — that's later sprints.

Verify: `npm run build`, `npm run lint`, `npm test` all pass — paste real output. Confirm a placeholder page renders using the design tokens.

Finish by updating `ImplementationPlan.md`: tick Sprint 1 acceptance criteria, set Status to DONE/PARTIAL, update the Current State Snapshot, and write the "Sprint 1" Progress Log & Handover entry (what you built, key files, decisions, known issues, verification output, and the first thing Sprint 2 should verify).
```

---

## Sprint 2

```
You are running SPRINT 2 of a 10-sprint build. Working dir: the current folder.

First, read `ImplementationPlan.md` §0, §1, the "SPRINT 2" section, AND the Sprint 1 entry in "Progress Log & Handover" — trust the handover for what actually exists.

Then execute ONLY Sprint 2: build the typed backbone. In `src/lib/types/` define Zod schemas + types for TripConstraints, TripState, ItineraryDay/ItineraryItem, StayRecommendation, LogisticsLeg, BudgetBreakdown, ReviewResult (exact fields per the Sprint 2 spec). In `src/lib/gemini/client.ts` build a mockable Gemini 2.5 Flash Lite wrapper (@google/genai) that takes a Zod schema + prompt and returns validated typed JSON, with retry-on-bad-JSON (max 2), timeout, and a cost-logging hook. Add `src/lib/agents/base.ts` (BaseAgent abstraction) and `src/lib/env.ts` (validate GEMINI_API_KEY). Unit-test everything with a MOCKED Gemini client — no live API calls.

Do NOT write real agent prompts/behavior, API routes, or UI.

Verify: `npm test` + `npm run build` green — paste output.

Finish by updating `ImplementationPlan.md` (Sprint 2 checkboxes, Status, snapshot, and the Sprint 2 handover entry incl. the first thing Sprint 3 should verify).
```

---

## Sprint 3

```
You are running SPRINT 3 of a 10-sprint build. Working dir: the current folder.

First, read `ImplementationPlan.md` §0, §1, the "SPRINT 3" section, AND the Sprint 1–2 handover entries. Reuse the types and Gemini client from Sprint 2 — don't recreate them.

Then execute ONLY Sprint 3: build the Orchestrator's constraint extraction. Create `src/lib/prompts/orchestrator.ts` (few-shot extraction prompt using the PRD Japan example) and `src/lib/agents/orchestrator.ts` with `extractConstraints(request)` → validated TripConstraints, plus ambiguity/low-confidence detection populating `clarifications_needed[]`. Add a stub `synthesize()` signature with a TODO (full wiring is Sprint 5). Test with mocked Gemini: full Japan request, under-specified request, conflicting constraints.

Do NOT implement specialist agents, synthesis/merge, the pipeline, API, or UI.

Verify: tests + build green — paste output.

Finish by updating `ImplementationPlan.md` (Sprint 3 checkboxes, Status, snapshot, Sprint 3 handover entry incl. first thing Sprint 4 should verify).
```

---

## Sprint 4

```
You are running SPRINT 4 of a 10-sprint build. Working dir: the current folder.

First, read `ImplementationPlan.md` §0, §1, the "SPRINT 4" section, AND the Sprint 1–3 handover entries. Reuse existing types, Gemini client, and TripConstraints.

Then execute ONLY Sprint 4: build the two content specialists. Add typed sample grounding data for Japan (Tokyo+Kyoto) in `src/lib/data/` (neighborhoods, temples, food areas, crowd/off-peak notes, Shinkansen ~2h15m, hotel price ranges, intra-city travel times). Build `src/lib/agents/destinationResearch.ts` (+prompt): preference-aligned, crowd-aware recommendations tagged must-do/nice-to-have. Build `src/lib/agents/logistics.ts` (+prompt): stay split per city, LogisticsLeg[], and a non-backtracking day sequence. Test with mocked Gemini + fixtures (assert crowd-avoidance + feasible sequencing).

Do NOT implement budget, review, the merge/pipeline, live external APIs, the API layer, or UI.

Verify: tests + build green — paste output.

Finish by updating `ImplementationPlan.md` (Sprint 4 checkboxes, Status, snapshot, Sprint 4 handover entry incl. first thing Sprint 5 should verify).
```

---

## Sprint 5

```
You are running SPRINT 5 of a 10-sprint build. Working dir: the current folder.

First, read `ImplementationPlan.md` §0, §1, the "SPRINT 5" section, AND the Sprint 1–4 handover entries. Reuse the orchestrator, both specialists, types, and Gemini client.

Then execute ONLY Sprint 5: complete the backend brain. Build `src/lib/agents/budget.ts` (+prompt): BudgetBreakdown, overspend flagging vs budget_usd, cheaper alternatives, currency normalization. Build `src/lib/agents/review.ts` (+prompt): the PRD's 6 checks → ReviewResult with per-check structured feedback. Build `src/lib/agents/pipeline.ts` implementing the Orchestrator's full synthesize: run Destination + Logistics + Budget IN PARALLEL (Promise.all), merge into ItineraryDay[], run Review, loop targeted re-plan on failure (max 2) then deliver best-effort + caveats; handle partial agent failure gracefully. Integration-test the full Japan request (mocked Gemini) → validated 5-day, both-cities, ≤$3,000, food+temple itinerary; assert parallelism and the bounded re-plan loop.

Do NOT build the API/HTTP layer or any UI.

Verify: tests + build green — paste output.

Finish by updating `ImplementationPlan.md` (Sprint 5 checkboxes, Status, snapshot, Sprint 5 handover entry incl. first thing Sprint 6 should verify).
```

---

## Sprint 6

```
You are running SPRINT 6 of a 10-sprint build. Working dir: the current folder.

First, read `ImplementationPlan.md` §0, §1, the "SPRINT 6" section, AND the Sprint 1–5 handover entries. Reuse the pipeline from Sprint 5.

Then execute ONLY Sprint 6: expose the backend over HTTP. Add route handlers under `app/api/`: `POST /api/parse` → TripConstraints (+clarifications_needed); `POST /api/plan` → SSE stream of ordered agent progress events then a final itinerary event. Add Zod request validation + structured errors, guardrails (reject non-travel/prompt-injection + length limits), caching of destination research per (destination, preferences), and cost/latency logging. Test route handlers with a mocked pipeline incl. an SSE event-sequence test.

Do NOT build any React UI. Append a clear API CONTRACT (request/response/event shapes) to the Sprint 6 handover for the frontend sprints.

Verify: tests + build green — paste output.

Finish by updating `ImplementationPlan.md` (Sprint 6 checkboxes, Status, snapshot, Sprint 6 handover entry — MUST include the full API contract — and the first thing Sprint 7 should verify).
```

---

## Sprint 7

```
You are running SPRINT 7 of a 10-sprint build. Working dir: the current folder.

First, read `ImplementationPlan.md` §0, §1, the "SPRINT 7" section, AND the Sprint 1–6 handover entries (especially the Sprint 6 API contract). Design references: `stitch_responsive_web_interface/landing_page/` and `.../constraint_confirmation/` (HTML + screen.png) and DESIGN.md. Rebuild as React components — do NOT embed raw exported HTML.

Then execute ONLY Sprint 7: build the shared component library in `src/components/` (Button primary-coral/secondary-teal, Chip/Tag, PriorityPill, Card, TopNav, Layout container) matching the design tokens, then the Landing screen (hero, NL input with PRD placeholder, Plan-my-trip CTA, example chips, 3-step how-it-works, nav) and the Constraint-Confirmation screen (calls POST /api/parse, editable constraint chips, clarification handling, build-my-plan CTA). Carry constraints into the next step via client state. Add component tests + a Playwright landing→confirmation path.

Do NOT build the progress or itinerary screens.

Verify: component tests + Playwright + build green; screens responsive and match the designs — paste output.

Finish by updating `ImplementationPlan.md` (Sprint 7 checkboxes, Status, snapshot, Sprint 7 handover entry incl. first thing Sprint 8 should verify).
```

---

## Sprint 8

```
You are running SPRINT 8 of a 10-sprint build. Working dir: the current folder.

First, read `ImplementationPlan.md` §0, §1, the "SPRINT 8" section, AND the Sprint 1–7 handover entries (reuse the component library + API contract). Design references: `stitch_responsive_web_interface/ai_planning_in_progress/` and `.../your_itinerary/` + DESIGN.md.

Then execute ONLY Sprint 8: build the Progress screen (consume POST /api/plan SSE; visualize Orchestrator + 3 parallel specialists → Review with checkmarks + live status) and the Itinerary result screen (day cards with morning/afternoon/evening items showing title, description, category tag, must-do/nice-to-have pill, est. cost, plus per-day Regenerate/Make-cheaper buttons; sticky sidebar with Review compliance card, budget breakdown bars + "total $X of $Y", and stay/logistics summary; header with title/dates/Export/Share/Save where Save→localStorage). Add loading/skeleton + error states. Component tests + a Playwright landing→plan→itinerary path against a mocked/seeded backend.

Do NOT build the stay-detail, adjustment/edge screens, or real export/share — those are Sprint 9.

Verify: tests + E2E + build green — paste output.

Finish by updating `ImplementationPlan.md` (Sprint 8 checkboxes, Status, snapshot, Sprint 8 handover entry incl. first thing Sprint 9 should verify).
```

---

## Sprint 9

```
You are running SPRINT 9 of a 10-sprint build. Working dir: the current folder.

First, read `ImplementationPlan.md` §0, §1, the "SPRINT 9" section, AND the Sprint 1–8 handover entries. Design references: `stitch_responsive_web_interface/stay_logistics_details/` and `.../request_adjustment/` + DESIGN.md.

Then execute ONLY Sprint 9: build the Stay & Logistics detail screen (neighborhood cards with photo/name/why-this-area/price/map placeholder; inter-city Shinkansen card with duration/cost/"Book" deep-link — link out only, no transaction) and the Request-Adjustment/infeasible edge screen (friendly suggestions that re-trigger planning). Wire the edit/regenerate flows ("Regenerate this day", "Make it cheaper", chip editing) to /api/regenerate-day & /api/cheaper (implement these handlers now if Sprint 6 deferred them). Implement Export (PDF/print), Share (serialized link), and Save (localStorage) + a basic "my trips" list. Tests for each new screen + the edit/regenerate round-trip.

Do NOT add accounts/DB, real booking, or collaboration.

Verify: tests + build green — paste output.

Finish by updating `ImplementationPlan.md` (Sprint 9 checkboxes, Status, snapshot, Sprint 9 handover entry incl. first thing Sprint 10 should verify).
```

---

## Sprint 10

```
You are running SPRINT 10 (final) of a 10-sprint build. Working dir: the current folder.

First, read `ImplementationPlan.md` §0, §1, the "SPRINT 10" section, AND all prior handover entries. This sprint is hardening only — NO new features.

Then execute ONLY Sprint 10: build the full Playwright E2E suite (happy, clarification, infeasible, edit paths); fix accessibility (keyboard nav, focus, ARIA, contrast — target lighthouse a11y ≥ 90); measure and tune time-to-first-itinerary (PRD P50 ≤ 30s; caching/parallelism, lazy images); finalize guardrails (injection/off-topic rejection) and observability (structured logging + cost-per-plan and latency metrics surface; hallucination spot-audit hook); verify graceful degradation on agent timeout/partial failure end-to-end; add deploy config (vercel.json or Dockerfile + env handling) and finalize README + a short ARCHITECTURE.md.

Verify: full E2E suite green, no critical a11y violations, metrics emitted, production build + deploy steps verified — paste output.

Finish by updating `ImplementationPlan.md` (Sprint 10 checkboxes, Status, snapshot — all rows should be ✅ — and the Sprint 10 handover entry summarizing the final state and any remaining future enhancements, e.g., live external travel APIs and accounts/DB).
```
