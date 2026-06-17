# Product Requirements Document — AI Travel Planner

**Document owner:** Product
**Status:** Draft v1.0
**Last updated:** 2026-06-16
**LLM of record:** Google **Gemini 2.5 Flash Lite** (planning, extraction, synthesis, and review across all agents)

---

## 1. Overview

### 1.1 One-liner
A natural-language travel planner that turns a single sentence — *"Plan a 5-day trip to Japan. Tokyo + Kyoto. $3,000 budget. Love food and temples, hate crowds."* — into a complete, budget-aware, day-by-day itinerary using a coordinated **multi-agent system**.

### 1.2 The product in one paragraph
Most travelers don't want a search engine; they want an *answer*. Today, planning a trip means juggling ten browser tabs (flights, hotels, blogs, maps, currency converters, restaurant reviews) and manually reconciling them against a budget and personal taste. The AI Travel Planner collapses that work into one request. An **Orchestrator** agent parses intent and constraints, then dispatches three specialist agents — **Destination Research**, **Logistics**, and **Budget** — to work in parallel. A **Review** agent validates the merged plan against the user's stated constraints before it is shown. The output is a realistic, opinionated itinerary the user can actually follow.

### 1.3 Why now
- **LLMs are good enough at synthesis and cheap enough to run.** Gemini 2.5 Flash Lite offers low-latency, low-cost inference that makes a multi-agent fan-out economically viable per request.
- **Travelers already trust AI for first drafts.** Post-2023, "ask AI to plan my trip" became a mainstream behavior; users now expect structured, personalized output, not a wall of links.
- **The data exists in accessible APIs.** Maps/distance, rail/transit, hotel and flight pricing, and review data are all reachable via APIs or structured scraping, enabling grounded (not hallucinated) recommendations.

---

## 2. Why this product works

| Reason | Explanation |
|---|---|
| **Single input, complete output** | The user expresses intent once in plain language. No forms, no filters, no tab-juggling. |
| **Constraint satisfaction is the hard part — and we own it** | Budget, time, geography, and taste constantly conflict. A dedicated Budget agent + Review agent makes the plan *respect* constraints instead of ignoring them. |
| **Parallel specialists beat one generalist prompt** | Splitting research, logistics, and budgeting into focused agents yields deeper, less hallucinated results than a single mega-prompt, and the Review agent catches contradictions. |
| **Opinionated, not exhaustive** | Users are paralyzed by 50 options. We give a defensible "must-do vs nice-to-have" plan with reasoning, which is what a good human travel agent does. |
| **Personalization is the moat** | "Hate crowds," "love temples," "traveling with a toddler" — preference-aware planning is hard to copy with generic search and is exactly what users remember. |

---

## 3. Market & competitive landscape

### 3.1 Alternatives that exist today

| Category | Examples | What they do well | Where they fall short |
|---|---|---|---|
| **Manual DIY** | Google Search, Google Maps, TripAdvisor, blogs, Reddit | Authoritative, real reviews | Hours of synthesis; no budget reconciliation; no personalization |
| **OTAs / booking engines** | Booking.com, Expedia, Airbnb, Skyscanner | Inventory + transactions | Built to sell rooms/flights, not to *plan*; no holistic itinerary |
| **AI trip generators** | Layla (ex-Roam Around), Wonderplan, Mindtrip, GuideGeek, Trip Planner AI | Natural-language input, instant itineraries | Often shallow, generic, hallucinated logistics, weak budget math, little crowd/preference nuance |
| **General-purpose LLMs** | ChatGPT, Gemini, Claude | Flexible, conversational | No grounded pricing/logistics, no validation loop, drifts off-constraint, no booking path |
| **Human travel agents / concierge** | Local agents, Amex Travel | Deep expertise, accountability | Expensive, slow, not scalable, limited availability |

### 3.2 Our differentiated wedge
1. **Constraint fidelity** — a Budget agent that does real math and a Review agent that *blocks* non-compliant plans. Competitors rarely guarantee "fits 5 days AND under $3,000 AND avoids crowds."
2. **Anti-crowd / preference intelligence** — explicitly surfacing quiet alternatives and off-peak timing, a frequently requested but poorly served need.
3. **Logistics realism** — sequencing that minimizes backtracking and uses real travel times (e.g., Shinkansen), reducing the "this plan is physically impossible" failure mode.

---

## 4. User pain points (with anecdotes)

> **Persona A — "The Overwhelmed Optimizer" (Priya, 29, software engineer)**
> *"I had 18 tabs open for my Japan trip. A blog said Fushimi Inari was a must; another said go at 6 a.m. or skip it. I built a spreadsheet, then realized my hotel choice in Shinjuku blew $400 of my food budget. I gave up and just winged it — and spent two of five days standing in lines."*
> **Pain:** Synthesis overload, budget blindness, crowd surprises.

> **Persona B — "The Constraint Juggler" (The Martins, family of 4)**
> *"Every AI tool gave us a beautiful itinerary that ignored that we have a 4-year-old. It scheduled a 90-minute temple, then a museum across town, then dinner an hour away. Nap time? Forget it. The plan looked great and was completely unusable."*
> **Pain:** Plans that ignore real-world feasibility and personal constraints.

> **Persona C — "The Budget-Anxious Traveler" (Marcus, 24, first international trip)**
> *"I set a $3,000 cap. ChatGPT happily recommended a $550/night hotel and a $300 omakase. By the time I added it up myself, I was $1,400 over. I needed something that tells me 'this is too expensive, here's a cheaper area' before I fall in love with it."*
> **Pain:** No real-time budget reconciliation; plans that overshoot silently.

> **Persona D — "The Logistics Pessimist" (Elena, 35, solo traveler)**
> *"An AI told me to do Tokyo and Kyoto 'flexibly' but never explained how to get between them or how long it takes. I didn't know the Shinkansen was 2.5 hours and needed to be booked. I almost wasted a whole day figuring it out."*
> **Pain:** Vague, non-actionable logistics.

**Common thread:** users don't lack *options* — they lack a trustworthy synthesis that respects time, money, geography, and taste simultaneously.

---

## 5. Goals & success metrics

### 5.1 Product goals
1. Produce a **complete, constraint-compliant itinerary** from a single natural-language request.
2. Make budget and feasibility **first-class, validated outputs**, not afterthoughts.
3. Surface **preference-aware** recommendations (e.g., crowd avoidance) that feel personally tailored.

### 5.2 Non-goals (v1)
- Booking/transacting flights and hotels (we *link out*, not transact).
- Real-time inventory and live pricing guarantees.
- Multi-traveler collaborative editing.
- Destinations outside an initial supported set (see Phases).

### 5.3 Success metrics

| Metric | Definition | Target (first 90 days post-GA) |
|---|---|---|
| **Plan completion rate** | % of requests that produce a Review-approved itinerary | ≥ 95% |
| **Constraint compliance** | % of delivered plans within budget, day count, cities, and preference tags | ≥ 90% |
| **Time-to-first-itinerary** | P50 latency from request to rendered plan | ≤ 30s |
| **Plan acceptance** | % of users who save/export/share the plan vs. regenerate-and-abandon | ≥ 40% |
| **Edit depth** | Median number of user edits before acceptance (lower = better first draft) | ≤ 3 |
| **Cost per plan** | Blended LLM + API cost per completed plan | ≤ $0.15 |
| **CSAT** | Post-plan thumbs-up / 5-star rating | ≥ 4.3 / 5 |
| **D30 retention** | % of users who return to plan a second trip within 30 days | ≥ 20% |

### 5.4 Guardrail metrics
- **Hallucinated-fact rate** (closed/nonexistent venues, impossible routes): < 3% of plans (spot-audited).
- **Budget overshoot when "within budget" is claimed:** < 5%.

---

## 6. Multi-agent system design

### 6.1 Architecture

```
                       ┌─────────────────────────────┐
        User request → │      ORCHESTRATOR AGENT      │
                       │  parse intent + constraints  │
                       │  delegate + synthesize       │
                       └──────────────┬──────────────┘
                                      │ (parallel fan-out)
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
 ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
 │  DESTINATION    │        │   LOGISTICS     │        │     BUDGET      │
 │   RESEARCH      │        │     AGENT       │        │     AGENT       │
 │  places, food,  │        │  stay, transit, │        │  cost breakdown,│
 │  quiet options  │        │  sequencing     │        │  cheaper alts   │
 └────────┬────────┘        └────────┬────────┘        └────────┬────────┘
          └───────────────────────────┼───────────────────────────┘
                                      ▼
                       ┌─────────────────────────────┐
                       │       REVIEW AGENT           │
                       │ validate vs all constraints  │
                       │ pass → deliver / fail → loop │
                       └──────────────┬──────────────┘
                                      ▼
                              Final itinerary → User
```

**Flow:** `Orchestrator → [Destination, Logistics, Budget in parallel] → Review → (loop back on failure) → User`

All agents are powered by **Gemini 2.5 Flash Lite**, chosen for its low cost and latency, which makes the parallel fan-out and the Review feedback loop economical.

### 6.2 Agent specifications

#### 6.2.1 Orchestrator Agent
- **Role:** Master planner. Parses the request, extracts a structured constraint object, delegates, and synthesizes outputs into the final itinerary.
- **Input:** Raw natural-language request.
- **Output:** Structured `TripConstraints` JSON + the merged draft itinerary.
- **Extracted constraints (example):**
  ```json
  {
    "destination": "Japan",
    "duration_days": 5,
    "cities": ["Tokyo", "Kyoto"],
    "budget_usd": 3000,
    "preferences": ["food", "temples"],
    "avoidances": ["crowds"],
    "travelers": 1,
    "pace": "moderate"
  }
  ```
- **Responsibilities:** intent extraction, ambiguity detection (ask clarifying questions when confidence is low), task delegation, conflict resolution between agent outputs, final assembly.

#### 6.2.2 Destination Research Agent
- **Role:** Finds the best places, experiences, and food aligned to preferences.
- **Inputs:** Web search, travel guides, restaurant reviews, attraction summaries.
- **Does:** Recommends neighborhoods, temples, food streets, local experiences; flags less-crowded options and off-peak timing; classifies items as **must-do** vs **nice-to-have**.
- **Example output:** quiet temple areas in Kyoto (e.g., Ohara, early-morning Fushimi Inari); food neighborhoods in Tokyo (Tsukiji Outer Market, Yanaka); off-peak experiences.

#### 6.2.3 Logistics Agent
- **Role:** The practical side — moving and staying.
- **Inputs:** Hotel APIs / sample hotel data, train & transit routes, maps/distance tools.
- **Does:** Suggests where to stay per city, estimates inter-location travel time, recommends inter-city transport (e.g., Shinkansen Tokyo↔Kyoto), builds a realistic day sequence that reduces backtracking.
- **Example output:** 2 nights Tokyo, 2 nights Kyoto, 1 flexible day; Shinkansen between cities; geographically clustered day plans.

#### 6.2.4 Budget Agent
- **Role:** Keeps the plan within budget.
- **Inputs:** Currency conversion, hotel cost estimates, food/transport price ranges, attraction pricing.
- **Does:** Breaks budget into **Stay / Transport / Food / Activities**; flags overspend; proposes cheaper alternatives.
- **Example output:** *Estimated total $2,650; central Tokyo hotel too high → suggest Asakusa/Ueno.*

#### 6.2.5 Review Agent (Quality Gate)
- **Role:** Validates the final itinerary before delivery.
- **Checks:**
  - Fits exactly into the requested duration (5 days)?
  - Includes all required cities (Tokyo **and** Kyoto)?
  - Within budget ($3,000)?
  - Aligns with preferences (food + temples)?
  - Attempts to avoid crowded experiences?
  - Travel-time realistic / physically possible?
- **Behavior:** On **pass** → deliver. On **fail** → return structured feedback to the Orchestrator for a bounded number of re-plan loops (e.g., max 2) before delivering a best-effort plan with explicit caveats.

### 6.3 Inter-agent contract
- All agents return **structured JSON** with a confidence score and source citations where applicable.
- The Orchestrator maintains the canonical `TripState`; specialist agents are stateless per call.
- The Review Agent's feedback is structured (`{check, status, reason, suggested_fix}`) so re-planning is targeted, not a full restart.

---

## 7. Features to build

### 7.1 Core (must-have for v1)
1. **Natural-language request input** with constraint extraction and a confirmation summary ("Got it: 5 days, Tokyo + Kyoto, $3k, food + temples, low-crowd — correct?").
2. **Day-by-day itinerary** with morning/afternoon/evening blocks, each item tagged (food / temple / experience; must-do / nice-to-have).
3. **Stay recommendations** per city with neighborhood rationale.
4. **Inter-city & intra-city logistics** with travel times and transport mode.
5. **Budget breakdown** by category with running total and overshoot flags.
6. **Crowd/preference awareness** — quiet alternatives and best-time-to-go notes.
7. **Review validation badge** — visible "✓ Fits 5 days · ✓ Under $3,000 · ✓ Both cities" compliance summary.
8. **Export/share** — copy, PDF, shareable link.

### 7.2 High-value (fast follow)
9. **Inline editing & regenerate-a-day** — "swap day 3," "make it cheaper," "more food."
10. **Clarifying-question flow** when constraints are ambiguous or conflicting.
11. **Booking deep-links** to OTAs/rail for hotels, trains, attractions (affiliate path).
12. **Save trips / account** and trip history.

### 7.3 Future
13. Multi-city/multi-country routing, collaborative editing, calendar export, real-time price refresh, mobile app, offline mode.

---

## 8. Edge cases & handling

| Edge case | Handling |
|---|---|
| **Budget impossible for scope** (e.g., $300 for 5 days in Japan incl. flights) | Budget + Review flag infeasibility; Orchestrator returns best-effort plan with an explicit "this needs ~$X to be realistic" note and cheaper-scope suggestions. |
| **Conflicting preferences** ("luxury hotels" + "$500 budget") | Clarifying question; if unresolved, prioritize the hard constraint (budget) and caveat the soft one. |
| **Ambiguous / underspecified request** ("plan a trip to Japan") | Orchestrator asks targeted clarifying questions (duration, budget, interests) before fan-out. |
| **Too many cities for the days** (5 cities in 3 days) | Logistics flags over-packing; Review fails; Orchestrator proposes a trimmed realistic set. |
| **Off-season / closed attractions / holidays** | Destination + Logistics check seasonality; warn about closures and national holidays affecting crowds/transit. |
| **No/low-confidence data for a destination** | Degrade gracefully: mark items "unverified," lower confidence, avoid fabricating specifics. |
| **Currency / non-USD budget** | Budget Agent normalizes via currency conversion; display in user's currency. |
| **Crowd-avoidance impossible** (iconic site is always busy) | Offer mitigations (early/late timing, side entrances, alternatives) rather than silently scheduling peak times. |
| **Single-city or 1-day trip** | System scales down gracefully (no forced multi-city logic). |
| **Agent timeout / partial failure** | Orchestrator proceeds with available outputs, Review notes the gap, plan is delivered with caveats rather than failing entirely. |
| **Prompt injection / off-topic request** | Input guardrails reject non-travel or malicious requests. |
| **Re-plan loop doesn't converge** | Hard cap on loops (e.g., 2); deliver best-effort plan with transparent caveats. |

---

## 9. Phases of implementation

### Phase 0 — Foundations (Weeks 1–2)
- Define `TripConstraints` / `TripState` schemas and inter-agent JSON contract.
- Stand up Gemini 2.5 Flash Lite integration, prompt templates, and orchestration framework.
- Wire one destination's sample data (Japan: Tokyo + Kyoto) end-to-end.

### Phase 1 — MVP / Internal alpha (Weeks 3–6)
- All five agents functional with the parallel-fan-out + Review loop.
- Core features 1–7 (§7.1) working for the seed destination set (Japan).
- Mocked/sample logistics & pricing data acceptable; focus on plan quality and constraint compliance.
- **Exit criteria:** ≥ 90% constraint compliance on a 50-request internal test set; P50 latency ≤ 45s.

### Phase 2 — Private beta (Weeks 7–10)
- Replace sample data with live APIs (maps/distance, rail/transit, hotel pricing, reviews).
- Add export/share, clarifying-question flow, and inline "regenerate a day."
- Expand to 5–8 high-demand destinations.
- Invite-only waitlist users; instrument all success metrics.
- **Exit criteria:** CSAT ≥ 4.2; acceptance ≥ 35%; cost/plan ≤ $0.20.

### Phase 3 — GA / Public launch (Weeks 11–16)
- Booking deep-links + affiliate integration; accounts & trip history.
- Scale destination coverage; harden guardrails, caching, and cost controls.
- Public launch with GTM (§10).
- **Exit criteria:** metrics in §5.3 met; infra stable at target QPS.

### Phase 4 — Expansion (Post-GA)
- Multi-country routing, collaboration, mobile app, calendar export, live price refresh, premium tier.

---

## 10. Go-to-market plan

### 10.1 Positioning
**"Tell us your trip in a sentence. Get a plan you can actually follow — on budget, on time, on taste."**
Differentiators to lead with: **budget-honest**, **crowd-aware**, **logistically real**.

### 10.2 Target segments (launch order)
1. **Independent millennial/Gen-Z travelers** planning 1–2 international trips/year (high intent, AI-comfortable).
2. **Budget-conscious first-time international travelers** (the §4 Marcus persona).
3. **Families & groups** needing feasibility-aware plans (fast follow once editing/collaboration lands).

### 10.3 Pricing & monetization
- **Free tier:** limited plans/month, full itinerary, ads-free.
- **Pro (subscription):** unlimited plans, advanced editing, multi-city, price refresh, PDF/offline.
- **Affiliate revenue:** commissions on hotel/rail/activity booking deep-links (primary near-term revenue, even on free tier).

### 10.4 Channels
- **Content/SEO:** programmatic destination guides ("AI itinerary for Tokyo + Kyoto under $3,000") capturing high-intent search.
- **Social proof:** shareable itinerary links (built-in virality) + short-form video (TikTok/Reels/YouTube) showing "one sentence → full plan."
- **Communities:** travel subreddits, Discords, and creator partnerships (travel influencers generate real plans on camera).
- **Waitlist → referral loop** during beta; referrals unlock Pro features.
- **Partnerships:** OTAs/rail operators for affiliate placement; later, embedded planning widgets.

### 10.5 Launch motion
1. **Pre-launch:** waitlist + teaser content; seed SEO destination pages.
2. **Beta:** influencer-driven demos; collect testimonials and before/after "tabs vs. one sentence" stories.
3. **GA:** Product Hunt / Hacker News launch; PR around the multi-agent + budget-honesty angle; paid search on high-intent keywords once unit economics (cost/plan ≤ $0.15, affiliate take-rate) are proven.

### 10.6 GTM success metrics
- Waitlist → activated user conversion ≥ 40%.
- Viral coefficient (shares → new signups) ≥ 0.3.
- Blended CAC < projected 12-month LTV (affiliate + subscription).
- Organic share of signups ≥ 50% by end of Phase 4.

---

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **Hallucinated venues/routes erode trust** | Grounding via real APIs + citations; Review Agent feasibility checks; spot-audit guardrail metric. |
| **Inaccurate pricing** | Label estimates clearly; refresh via APIs in Phase 2+; never claim live guarantees in v1. |
| **Latency from multi-agent fan-out** | Parallel execution, Flash Lite's low latency, caching of destination research, bounded re-plan loops. |
| **Cost per plan creep** | Flash Lite + prompt/token budgets + caching; monitor cost/plan guardrail. |
| **Commoditization by general LLMs** | Defend with constraint fidelity, crowd intelligence, logistics realism, and booking integration. |
| **Data/API dependency & rate limits** | Multi-source fallbacks, caching, graceful degradation with caveats. |

---

## 12. Open questions
1. Initial destination coverage for GA — depth-first (Japan excellent) vs. breadth-first (many countries, shallower)?
2. Do we transact (booking) in-product later, or stay an affiliate referral layer?
3. How aggressive should the clarifying-question flow be vs. assuming sensible defaults to preserve the "one sentence → plan" magic?
4. Premium feature line — what's free vs. Pro at GA?
