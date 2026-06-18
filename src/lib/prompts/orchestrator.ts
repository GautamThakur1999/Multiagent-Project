/**
 * Prompt templates for the Orchestrator agent's constraint-extraction phase.
 *
 * The model is asked to return a permissive "extraction" object (see
 * `ExtractionSchema` in `src/lib/agents/orchestrator.ts`): hard constraints it
 * cannot determine are returned as `null` and listed in `clarifications_needed`
 * rather than being invented. This keeps the orchestrator honest about what the
 * user actually specified vs. what must be asked.
 */

export const ORCHESTRATOR_SYSTEM_INSTRUCTION = `You are the Orchestrator for an AI travel planner. Your only job in this phase is to read a traveler's natural-language request and extract structured trip constraints as JSON.

Rules:
- Output ONLY a single JSON object. No markdown, no prose, no code fences.
- Extract these fields: destination, duration_days, cities, budget_usd, currency, preferences, avoidances, travelers, pace, clarifications_needed.
- NEVER invent a duration, budget, or set of cities the traveler did not state or clearly imply. If a hard constraint (duration_days, cities, budget_usd, or destination) is missing or ambiguous, set it to null and add a specific, friendly question to "clarifications_needed".
- budget_usd must be a number in US dollars. If the user gives another currency, convert to an approximate USD number and set "currency" to the original currency code. If no budget is given, set budget_usd to null.
- "preferences" are things to seek (e.g. "food", "temples", "nature"). "avoidances" are things to avoid (e.g. "crowds"). Use lowercase short tags. Empty arrays are fine.
- pace is one of "slow" | "moderate" | "fast". Default to "moderate" only when the request clearly implies a relaxed/packed pace is acceptable; otherwise infer conservatively.
- travelers is an integer (default 1 if the user implies a solo trip; null if genuinely unknown and it matters).
- If the request contains CONFLICTING constraints (e.g. a luxury stay on an impossibly low budget), still extract what was said, and add a clarifying question to "clarifications_needed" describing the conflict and asking how to resolve it.
- If the input is not a travel-planning request, return null hard fields and a single clarification asking for a travel request.`;

interface FewShotExample {
  request: string;
  output: string;
}

// Few-shot anchored on the PRD's canonical Japan example, plus an
// under-specified example so the model learns to ask instead of guess.
const FEW_SHOT_EXAMPLES: FewShotExample[] = [
  {
    request:
      "Plan a 5-day trip to Japan. Tokyo + Kyoto. $3,000 budget. Love food and temples, hate crowds.",
    output: JSON.stringify({
      destination: "Japan",
      duration_days: 5,
      cities: ["Tokyo", "Kyoto"],
      budget_usd: 3000,
      currency: "USD",
      preferences: ["food", "temples"],
      avoidances: ["crowds"],
      travelers: 1,
      pace: "moderate",
      clarifications_needed: [],
    }),
  },
  {
    request: "Plan a trip to Japan.",
    output: JSON.stringify({
      destination: "Japan",
      duration_days: null,
      cities: null,
      budget_usd: null,
      currency: "USD",
      preferences: [],
      avoidances: [],
      travelers: null,
      pace: "moderate",
      clarifications_needed: [
        "How many days will your trip be?",
        "Which cities or regions of Japan would you like to visit?",
        "What is your total budget (and in which currency)?",
      ],
    }),
  },
];

/** Builds the full extraction prompt for a given user request. */
export function buildExtractionPrompt(request: string): string {
  const examples = FEW_SHOT_EXAMPLES.map(
    (ex) => `Request: ${ex.request}\nJSON: ${ex.output}`
  ).join("\n\n");

  return `${ORCHESTRATOR_SYSTEM_INSTRUCTION}

Examples:

${examples}

Now extract constraints for this request. Respond with JSON only.

Request: ${request}
JSON:`;
}
