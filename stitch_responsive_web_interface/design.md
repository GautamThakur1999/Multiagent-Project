# AI Travel Planner — Google Stitch Design Prompt

This file contains a copy-paste-ready prompt for generating the UI design of the **AI Travel Planner** in [Google Stitch](https://stitch.withgoogle.com), derived from `PRD_AI_Travel_Planner.md`.

---

## Master prompt (all screens)

> **App:** "AI Travel Planner" — a web app (also design mobile) that turns a single natural-language travel request into a complete, budget-aware, day-by-day itinerary using a multi-agent AI system. Tagline: *"Tell us your trip in a sentence. Get a plan you can actually follow — on budget, on time, on taste."*
>
> **Visual style:** Modern, clean, trustworthy travel product. Warm and editorial, not corporate. Primary color a deep teal/ocean blue (#0E7C7B or similar), accent coral/sunset orange for CTAs, soft neutral off-white background, generous whitespace, rounded corners (12–16px), subtle card shadows. Friendly geometric sans-serif (Inter or Plus Jakarta Sans). Use large destination photography. Light mode. Accessible contrast. Itinerary items use small colored tags (e.g., green = food, purple = temple, blue = experience) and "must-do" vs "nice-to-have" pills.
>
> Design the following screens:
>
> **1. Landing / Request screen.** Hero with a single large natural-language input box, placeholder text: *"Plan a 5-day trip to Japan. Tokyo + Kyoto. $3,000 budget. Love food and temples, hate crowds."* A prominent coral "Plan my trip" button. Below the input, 3–4 example-prompt chips users can click. Underneath, a simple 3-step "how it works" row: *Describe your trip → Our AI agents plan it → Get a plan that fits your budget & taste.* Minimal top nav (logo, "How it works", "Sign in").
>
> **2. Constraint-confirmation screen.** After submitting, show an AI-parsed summary card titled *"Got it — here's what I understood"* with editable chips: Destination: Japan · Duration: 5 days · Cities: Tokyo + Kyoto · Budget: $3,000 · Loves: Food, Temples · Avoids: Crowds · Travelers: 1. A "Looks right — build my plan" button and a "Edit" affordance on each chip.
>
> **3. Generating / agents-working screen.** A loading state visualizing the multi-agent system: four agent cards lighting up in parallel — **Destination Research**, **Logistics**, **Budget** — feeding into a **Review** check, with an Orchestrator at the top. Show progress states (checkmarks as each completes) and a friendly status line like *"Finding quiet temples and food streets…"*.
>
> **4. Itinerary result screen (the hero screen).** A two-column layout:
> - **Left/main column:** A day-by-day itinerary. Each day is a card ("Day 1 — Tokyo: Arrival & Asakusa") with morning / afternoon / evening time blocks. Each item shows a title, a one-line description, a colored category tag (food/temple/experience), a must-do or nice-to-have pill, and an estimated cost. Include a "Regenerate this day" and "Make it cheaper" inline action per day.
> - **Right sidebar (sticky):** A **compliance/validation badge card** from the Review agent showing green checks: *✓ Fits 5 days · ✓ Under $3,000 · ✓ Both cities · ✓ Food + temples · ✓ Low-crowd*. Below it, a **budget breakdown** card with a horizontal bar chart split into Stay / Transport / Food / Activities and a running total: *Estimated total: $2,650 of $3,000*. Below that, a **stay & logistics** summary: *2 nights Tokyo (Asakusa) · 2 nights Kyoto · Shinkansen Tokyo→Kyoto (~2h15m)*.
> - Top of screen: trip title, dates, and Export / Share / Save buttons.
>
> **5. Stay & logistics detail screen.** Neighborhood recommendation cards per city with a photo, name, a "why this area" rationale (e.g., *"Asakusa — traditional, walkable, near temples, cheaper than central Tokyo"*), price range, and a map snippet. A travel-between-cities card showing the Shinkansen route with duration and an estimated cost, plus a "Book" deep-link button.
>
> **6. Empty/edge state.** A friendly card for when a request is infeasible — e.g., *"A $300 budget won't cover 5 days in Japan. Here's what's realistic…"* with suggested adjustments.
>
> Make it feel premium, calm, and confidence-inspiring — the user should trust the plan is real and respects their constraints. Prioritize the itinerary result screen as the centerpiece.

---

## Tips for using this in Stitch

- **Stitch handles one screen well at a time.** If the multi-screen prompt gives a busy result, paste just **Screen 4 (the itinerary result)** first — it's the centerpiece — then generate the others individually using each numbered block.
- **Toggle mobile vs. web** in Stitch and re-run; the prompt notes both, but Stitch designs one form factor per generation.
- **Iterate with follow-ups** like *"make the budget breakdown a donut chart"* or *"darker, more editorial theme."*

---

## Style reference (for consistency across generations)

| Token | Value |
|---|---|
| Primary | Deep teal / ocean blue `#0E7C7B` |
| Accent / CTA | Coral / sunset orange |
| Background | Soft neutral off-white |
| Corners | 12–16px rounded |
| Font | Inter or Plus Jakarta Sans |
| Mode | Light |
| Category tags | Food = green · Temple = purple · Experience = blue |
| Priority pills | Must-do · Nice-to-have |
