# Architecture — AI Travel Planner

A natural-language travel request becomes a budget-aware, day-by-day itinerary via a
multi-agent system. Single Next.js app (App Router, TypeScript strict); all agents use
**Gemini 2.5 Flash Lite** with **structured output**; Zod validates every boundary.

## Multi-agent flow

```
        natural-language request
                  │
                  ▼
        Orchestrator (extract constraints)
                  │   TripConstraints (or clarifying questions)
                  ▼
   ┌──────────────┼──────────────┐   ← Promise.allSettled (parallel, degrade gracefully)
   ▼              ▼              ▼
Destination     Logistics      Budget
(recs, crowd-   (stays, legs,  (category cost
 aware)          day sequence)  breakdown)
   └──────────────┼──────────────┘
                  ▼
        deterministic merge → ItineraryDay[]
                  ▼
        Review (6 deterministic checks)
                  │   pass → deliver
                  │   fail → bounded re-plan (max 2) → best-effort + caveats
                  ▼
              TripState
```

- **Orchestrator** (`src/lib/agents/orchestrator.ts`): extracts a validated `TripConstraints`
  or a `needs_clarification` result; `synthesize()` delegates to the pipeline.
- **Specialists** (`destinationResearch`, `logistics`, `budget`): each `BaseAgent` runs from
  `TripConstraints` + Japan grounding data (`src/lib/data/japan.ts`), so they fan out in parallel.
  Budget **deterministically re-derives** totals (never trusts the model's arithmetic).
- **Review** (`src/lib/agents/review.ts`): a **deterministic** quality gate (duration, both
  cities, budget, preferences, crowd-avoidance, travel-time). Code, not an LLM, so it can't be
  gamed and the re-plan loop is reproducible.
- **Pipeline** (`src/lib/agents/pipeline.ts`): `runPipeline` orchestrates the fan-out, the
  deterministic itinerary merge, the Review gate, and the bounded re-plan; emits `onProgress`
  events for the SSE stream and degrades gracefully on any agent failure (caveats, never crashes).

## Request / data flow

```
Landing ( / )        ── POST /api/parse  { request }      ─▶ ExtractionResult
Confirm (/confirm)   ── POST /api/plan   { constraints }  ─▶ SSE: progress… → itinerary (TripState)
Plan    (/plan)         renders Progress → Itinerary  (or Adjustment if review failed)
Edit                 ── POST /api/regenerate-day / /api/cheaper  ─▶ updated day / TripState
Stay    (/stay)         reads the carried TripState (neighborhoods + Shinkansen Book deep-link)
Trips   (/trips)        localStorage save → list → view via ?shared= encoded state
```

- **Client state** (`src/components/PlanProvider.tsx`): request → constraints → tripState carried
  across navigation via React context + `sessionStorage`.
- **SSE**: `/api/plan` streams `event: progress|itinerary|error` frames; the client reads them with
  `fetch` + a `ReadableStream` reader (`streamPlanRequest`) — `EventSource` can't POST.
- **Sharing**: a plan is serialized to a URL-safe base64 `?shared=` param (no DB; v1 non-goal).

## Key technical decisions

| Area | Decision |
|---|---|
| LLM reliability | **Gemini structured output** (`responseJsonSchema` derived from Zod via `z.toJSONSchema`) forces schema-conforming JSON; Zod validation + bounded retries + graceful fallback are the backstop. |
| Validation | Zod for all agent I/O, API bodies, and env (`getEnv`). |
| Review gate | Deterministic (in code), not an LLM self-grade. |
| Parallelism | `Promise.allSettled` fan-out; one agent failing degrades to a caveated best-effort plan. |
| Caching | In-memory destination-research cache keyed by destination + taste (cuts cost/latency). |
| State (v1) | Stateless server-side; saved trips + shares are client-side. No DB, no accounts. |
| Observability | Per-call cost/latency log (`logging.ts`) + per-plan summary and hallucination spot-audit (`metrics.ts`). |
| Testing | Vitest with a **mocked** Gemini client (no live calls in CI) + Playwright E2E (system Chrome, stubbed APIs) + axe a11y scan. |

## Layout
`app/` routes + `app/api/` handlers · `src/lib/{agents,gemini,types,prompts,data,api}` (+ `env`,
`logging`, `metrics`, `planClient`, `shareLink`, `savedTrips`) · `src/components` · `tests/{unit,e2e}`.

## Known limitations / future work
- **Grounding data is a hand-curated Japan fixture.** Live web/maps/hotel/rail APIs are the top
  future enhancement (replaces `src/lib/data/japan.ts` + would un-stub the Book links).
- **No accounts/DB** — saved trips and shares are device-local; a backend store enables cross-device
  trips and short share links (current `?shared=` URLs can get large).
- **Edit granularity** — "Make it cheaper" re-optimizes the whole plan; per-day diffing could be finer.
- **Pre-existing `npm audit` advisories** (transitive dev deps) and Node 24-vs-20 are tracked but unaddressed.
