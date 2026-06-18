import type { GeminiClient } from "@/lib/gemini/client";
import {
  type BudgetBreakdown,
  BudgetBreakdownSchema,
  type TripConstraints,
} from "@/lib/types";
import { getDestinationData } from "@/lib/data/japan";
import { buildBudgetPrompt } from "@/lib/prompts/budget";
import { type AgentResult, type BaseAgent, AgentError } from "./base";

function withCurrencyNote(notes: string | undefined, currency: string): string | undefined {
  if (currency === "USD") return notes;
  const add = `All figures are in USD; the traveler's stated budget currency was ${currency}.`;
  return notes ? `${notes} ${add}` : add;
}

/**
 * Budget agent. Estimates a category cost breakdown via the LLM, then
 * **deterministically re-derives** total / within_budget / overspend against the
 * stated budget — the model's own arithmetic is never trusted for the gate.
 *
 * Runs from constraints alone (+ grounding data) so it can fan out in parallel
 * with the Destination and Logistics agents.
 */
export class BudgetAgent implements BaseAgent<TripConstraints, BudgetBreakdown> {
  readonly name = "budget";

  constructor(private readonly client: GeminiClient) {}

  async run(constraints: TripConstraints): Promise<AgentResult<BudgetBreakdown>> {
    const data = getDestinationData(constraints.destination);
    const prompt = buildBudgetPrompt(constraints, data);

    let raw: BudgetBreakdown;
    try {
      raw = await this.client.generateStructured(prompt, BudgetBreakdownSchema);
    } catch (err) {
      throw new AgentError(this.name, err);
    }

    // Deterministic re-derivation — categories are the source of truth.
    const total = Math.round(
      raw.stay_usd + raw.transport_usd + raw.food_usd + raw.activities_usd
    );
    const within = total <= constraints.budget_usd;

    const breakdown: BudgetBreakdown = {
      stay_usd: raw.stay_usd,
      transport_usd: raw.transport_usd,
      food_usd: raw.food_usd,
      activities_usd: raw.activities_usd,
      total_usd: total,
      within_budget: within,
      overspend_usd: within ? undefined : Math.round(total - constraints.budget_usd),
      cheaper_alternatives: raw.cheaper_alternatives,
      notes: withCurrencyNote(raw.notes, constraints.currency),
    };

    return {
      data: breakdown,
      confidence: data ? 0.85 : 0.6,
      citations: data ? [`grounding:${data.destination}`] : ["gemini-synthesized"],
    };
  }
}

export function createBudgetAgent(client: GeminiClient): BudgetAgent {
  return new BudgetAgent(client);
}
