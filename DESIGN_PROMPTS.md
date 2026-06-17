# DESIGN_PROMPTS.md - Prompts for Stitch by Google

Use the following prompts sequentially in Stitch by Google to generate the UI for the AI Travel Planner. 
**Prerequisite Instruction for Stitch:** *"Before starting, refer to the overarching DESIGN.md guidelines for color palette (Primary Teal #0F766E, Accent Orange #F97316), typography (Plus Jakarta Sans and Inter), and component styles. Use React, Tailwind CSS, and Lucide React icons."*

---

## Prompt 1: The Landing & Hero Screen

**Prompt Context:** This is the entry point for the user. We want to eliminate the standard travel site clutter (no date pickers, no passenger dropdowns). The focus is entirely on the "One-Sentence" natural language input.

**Stitch Prompt:**
> "Build a modern, high-converting landing page for an AI Travel Planner. Use the design system colors (Teal #0F766E, Orange #F97316). 
> 
> **Layout & Sections:**
> 1.  **Navbar:** Clean and minimal. Logo on the left (an icon of a spark and a globe), 'Sign In' and 'Pricing' on the right.
> 2.  **Hero Section:** Center-aligned text. A large heading (Plus Jakarta Sans) saying: 'Your perfect trip, planned in one sentence.' Below it, a subtle subheadline: 'No more juggling tabs. Tell our AI what you want, and get a budget-aware, crowd-avoiding itinerary instantly.'
> 3.  **The Core Input:** A massive, visually prominent text area centered on the screen with a soft shadow and rounded corners (16px). It should look like a magic search bar. Inside the text area, use placeholder text: 'Plan a 5-day trip to Japan. Tokyo + Kyoto. $3,000 budget. Love food and temples, hate crowds...' 
> 4.  **Submit Button:** Inside or attached to the bottom-right of the input box, a large Teal button with a 'Sparkle' icon saying 'Plan My Trip'.
> 5.  **Social Proof / Badges:** Below the input, display three small feature badges horizontally: '✓ Real-time Budgeting', '✓ Smart Logistics', '✓ Crowd-Avoidance'.
> 6.  **Example Prompts:** A small section underneath with 3 clickable pill-shaped tags showing examples like 'Honeymoon in Bali under $4k' or 'Weekend in NYC with kids'."

---

## Prompt 2: The Multi-Agent Loading / Orchestration Screen

**Prompt Context:** When the user hits 'Plan My Trip', we need a screen that explains the *value* of the AI. Instead of a generic spinner, we want to visually show the Orchestrator delegating to the Destination, Logistics, and Budget agents.

**Stitch Prompt:**
> "Build a loading/transition screen that makes the AI processing transparent and engaging. 
> 
> **Layout & UI Elements:**
> 1.  **Main Container:** Centered card on a light Slate background (#F8FAFC).
> 2.  **Title:** 'Drafting your itinerary...' with a subtle pulsing animation.
> 3.  **Agent Status List:** Create a vertical list of four steps/cards. Each step represents an AI agent at work. Use Lucide icons for each.
>     * *Step 1 (Complete):* 'Orchestrator Agent: Parsing your constraints...' (Show a green checkmark icon).
>     * *Step 2 (In Progress - Pulsing):* 'Destination Agent: Finding quiet temples and food spots...' (Show a Teal spinning/pulsing icon).
>     * *Step 3 (In Progress):* 'Logistics Agent: Calculating Shinkansen train times...' 
>     * *Step 4 (Waiting):* 'Budget & Review Agent: Reconciling costs to stay under $3,000...' (Show a grayed-out clock icon).
> 4.  **Visual Polish:** Use a clean, rounded card design for these steps. Add a subtle animated progress bar at the very top of the screen."

---

## Prompt 3: The Core Itinerary Dashboard (The Result)

**Prompt Context:** This is the flagship screen. The user receives their generated plan. It needs to handle high information density (days, times, places, prices) elegantly.

**Stitch Prompt:**
> "Build the main Itinerary Result Dashboard. This is a complex, data-rich screen. Use a 3-column layout (Sidebar, Main Timeline, Right Context).
> 
> **Layout structure:**
> **1. Top Navigation Bar:**
> * Trip Title: '5 Days in Tokyo & Kyoto'.
> * A prominent 'Review Validation Badge' (Emerald Green background, Check icon) that says '✓ Fits 5 days · ✓ Under $3k · ✓ Crowd-Optimized'.
> * 'Export' and 'Share' secondary buttons on the top right.
> 
> **2. Left Sidebar (Navigation & Filters):**
> * A vertical navigation list of days: 'Day 1: Arrival & Shinjuku', 'Day 2: Asakusa', 'Day 3: Travel to Kyoto', etc.
> * Active state for Day 1 (Teal background highlight).
> 
> **3. Middle Column (The Day's Itinerary - scrollable):**
> * Header: 'Day 1: Thursday, Oct 12th'.
> * **Itinerary Cards:** Render vertical cards connected by a dashed line (timeline style).
>   * *Card 1 (Morning):* 9:00 AM. 'Meiji Shrine (Early arrival)'. Include a badge '✓ Crowd-Free Time'. Add a 2-sentence description. Show travel logistics at the bottom of the card: '🚇 15 min via Yamanote Line'.
>   * *Card 2 (Lunch):* 12:30 PM. 'Afuri Ramen'. Include a badge '🍜 Food Preference'. Highlight estimated cost '$15'.
>   * *Card 3 (Afternoon):* 2:00 PM. 'Shibuya Crossing & Shopping'. Tagged as '🌟 Must-do'.
> * Include an inline 'Regenerate this day' ghost button at the bottom of the timeline.
> 
> **4. Right Column (Budget & Map):**
> * **Budget Breakdown Card:** A sticky widget. 
>     * Total: '$2,650 / $3,000'. Include a horizontal progress bar (Teal, turning red if over budget).
>     * Line items: 'Flights: $1200', 'Hotels: $800', 'Food: $450', 'Activities: $200'.
> * **Logistics Alert Card:** 'Train to Kyoto needed tomorrow. [Book Shinkansen tickets]'.
> * **Map Placeholder:** A gray rounded rectangle box at the bottom representing a map view with pins.
> 
> **Styling:** Ensure deep Teal (#0F766E) is used for active elements, Slate (#F8FAFC) for the app background, and crisp White (#FFFFFF) for cards."

---

## Prompt 4: The Budget Warning / Re-plan Interactive State

**Prompt Context:** Showing what happens when a user edits the itinerary and breaks a constraint (e.g., adding an expensive dinner).

**Stitch Prompt:**
> "Design the interactive state where a user modifies their itinerary and triggers the Budget/Review Agent's warning.
> 
> **Layout & Elements:**
> 1.  Use the same layout as the main Itinerary Dashboard, but focus on a modal or a slide-out panel that appears when the user clicks 'Swap Dinner'.
> 2.  **The Modal/Panel:** 'Alternative Dinner Options'.
> 3.  **The Options:**
>     * *Option A:* 'Sushi Saito ($300)'. Below it, display a bright Red error badge: '⚠️ Exceeds total trip budget by $150'.
>     * *Option B:* 'Kyoto Sushi Street ($45)'. Below it, display a Green success badge: '✓ Keeps you under budget'.
> 4.  **The Budget Sidebar Update:** Show the total budget number turning Amber/Red (#F59E0B or #EF4444) to indicate the pending change will break the constraints.
> 5.  Add a text area at the bottom: 'Tell the AI what else you are looking for...' to allow conversational refinement."
