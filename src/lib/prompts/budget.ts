import type { TripConstraints } from "@/lib/types";
import { type DestinationData, formatGroundingForPrompt } from "@/lib/data/japan";

export const BUDGET_SYSTEM_INSTRUCTION = `You are the Budget agent for an AI travel planner. Estimate a realistic cost breakdown in US dollars for the WHOLE trip and the WHOLE party.

Rules:
- Output ONLY a single JSON object. No markdown, no prose, no code fences.
- Shape: {"stay_usd","transport_usd","food_usd","activities_usd","total_usd","within_budget","overspend_usd","cheaper_alternatives","notes"}.
- All figures are totals in USD across every traveler and every night (not per-person, not per-night).
  - stay_usd: lodging for the whole stay.
  - transport_usd: inter-city + local transport (e.g. the Shinkansen, metro, buses).
  - food_usd: meals and snacks for the trip.
  - activities_usd: attraction entry, tours, experiences.
- Ground your numbers in the provided hotel price ranges, transport costs, and attraction prices.
- If your estimate exceeds the traveler's budget, propose concrete "cheaper_alternatives" (e.g. a cheaper neighborhood or swapping a paid activity for a free one).
- You may compute total_usd and within_budget, but they will be re-derived deterministically downstream — focus on accurate category estimates.`;

/** Builds the budget prompt for the given constraints + grounding data. */
export function buildBudgetPrompt(
  constraints: TripConstraints,
  data: DestinationData | null
): string {
  const grounding = data
    ? formatGroundingForPrompt(data, constraints.cities)
    : `(No curated price data for "${constraints.destination}". Use realistic general estimates and flag uncertainty in "notes".)`;

  const currencyNote =
    constraints.currency === "USD"
      ? ""
      : `\n- Note: the traveler stated their budget in ${constraints.currency}; it has already been converted to USD below. Keep all figures in USD.`;

  return `${BUDGET_SYSTEM_INSTRUCTION}

Traveler constraints:
- Destination: ${constraints.destination}
- Cities: ${constraints.cities.join(", ")}
- Trip length: ${constraints.duration_days} days
- Travelers: ${constraints.travelers}
- Total budget (USD): ${constraints.budget_usd}
- Pace: ${constraints.pace}${currencyNote}

${grounding}

Now produce the budget breakdown JSON. Respond with JSON only.
JSON:`;
}
