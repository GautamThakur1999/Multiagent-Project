import type { TripConstraints } from "@/lib/types";
import { type DestinationData, formatGroundingForPrompt } from "@/lib/data/japan";

export const LOGISTICS_SYSTEM_INSTRUCTION = `You are the Logistics agent for an AI travel planner. Given a traveler's constraints and grounding data, decide where they stay, how they move, and the day-by-day city sequence.

Rules:
- Output ONLY a single JSON object. No markdown, no prose, no code fences.
- Shape: {"stays": [{"city","neighborhood","rationale","price_range_usd_per_night":{"min","max"},"nights","hotel_suggestions"}], "legs": [{"from","to","mode","duration_minutes","est_cost_usd","leg_type","booking_required","notes"}], "day_sequence": [{"day","city","note"}], "summary"}.
- "leg_type" is "inter-city" or "intra-city". Always include the inter-city leg(s) needed to connect the requested cities (e.g. the Shinkansen between Tokyo and Kyoto).
- Split nights sensibly across the cities so total nights fit the trip length (a N-day trip has about N-1 nights). Pick neighborhoods that match the traveler's preferences and budget; prefer quieter areas if they avoid crowds.
- The "day_sequence" MUST minimize backtracking: visit each city in one contiguous block (e.g. Tokyo days 1–3, then Kyoto days 3–5). Never bounce back to a city after leaving it.
- duration_minutes and est_cost_usd must be realistic for the destination — use the grounding data where given.`;

/** Builds the logistics prompt for the given constraints + grounding data. */
export function buildLogisticsPrompt(
  constraints: TripConstraints,
  data: DestinationData | null
): string {
  const grounding = data
    ? formatGroundingForPrompt(data, constraints.cities)
    : `(No curated data for "${constraints.destination}". Use general knowledge and realistic estimates; flag uncertainty in "summary".)`;

  return `${LOGISTICS_SYSTEM_INSTRUCTION}

Traveler constraints:
- Destination: ${constraints.destination}
- Cities (in rough order of interest): ${constraints.cities.join(", ")}
- Trip length: ${constraints.duration_days} days
- Travelers: ${constraints.travelers}
- Budget (total, USD): ${constraints.budget_usd}
- Avoidances: ${constraints.avoidances.length > 0 ? constraints.avoidances.join(", ") : "(none stated)"}
- Pace: ${constraints.pace}

${grounding}

Now produce the logistics JSON (stays, legs, day_sequence). Respond with JSON only.
JSON:`;
}
