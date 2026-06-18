import type { TripConstraints } from "@/lib/types";
import { type DestinationData, formatGroundingForPrompt } from "@/lib/data/japan";

export const DESTINATION_RESEARCH_SYSTEM_INSTRUCTION = `You are the Destination Research agent for an AI travel planner. Given a traveler's constraints and grounding data, recommend the best places, food, temples, and experiences for them.

Rules:
- Output ONLY a single JSON object. No markdown, no prose, no code fences.
- Shape: {"recommendations": [{"name","city","category","neighborhood","description","priority","crowd_level","best_time","off_peak_tip","est_cost_usd"}], "summary"}.
- "category" is one of "food" | "temple" | "experience".
- "priority" is "must-do" or "nice-to-have". Mark only the genuine highlights as "must-do".
- "crowd_level" is "low" | "medium" | "high".
- Align recommendations to the traveler's preferences. Prefer places in the requested cities.
- If the traveler's avoidances include crowds, FAVOR low-crowd options, and for any unavoidable high-crowd "must-do", you MUST include an "off_peak_tip" describing how/when to avoid the worst of it.
- Ground every recommendation in the provided data — do not invent venues that are not plausible for the destination.
- est_cost_usd is the approximate per-person cost (0 for free sites).`;

/** Builds the destination-research prompt for the given constraints + grounding data. */
export function buildDestinationResearchPrompt(
  constraints: TripConstraints,
  data: DestinationData | null
): string {
  const grounding = data
    ? formatGroundingForPrompt(data, constraints.cities)
    : `(No curated data for "${constraints.destination}". Use general knowledge, mark recommendations as lower-confidence, and avoid inventing specific venues.)`;

  const avoidances =
    constraints.avoidances.length > 0 ? constraints.avoidances.join(", ") : "(none stated)";
  const preferences =
    constraints.preferences.length > 0 ? constraints.preferences.join(", ") : "(none stated)";

  return `${DESTINATION_RESEARCH_SYSTEM_INSTRUCTION}

Traveler constraints:
- Destination: ${constraints.destination}
- Cities: ${constraints.cities.join(", ")}
- Trip length: ${constraints.duration_days} days
- Travelers: ${constraints.travelers}
- Preferences (seek): ${preferences}
- Avoidances (avoid): ${avoidances}
- Pace: ${constraints.pace}

${grounding}

Now produce the recommendations JSON. Respond with JSON only.
JSON:`;
}
