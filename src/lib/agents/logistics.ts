import type { GeminiClient } from "@/lib/gemini/client";
import {
  type DaySequenceEntry,
  type LogisticsPlan,
  LogisticsPlanSchema,
  type TripConstraints,
} from "@/lib/types";
import { getDestinationData } from "@/lib/data/japan";
import { buildLogisticsPrompt } from "@/lib/prompts/logistics";
import { type AgentResult, type BaseAgent, AgentError } from "./base";

/**
 * True if no city is revisited after the itinerary has left it — i.e. each city
 * occupies one contiguous block of days. Catches plans like Tokyo→Kyoto→Tokyo.
 */
export function isNonBacktrackingSequence(sequence: DaySequenceEntry[]): boolean {
  const completed = new Set<string>();
  let current: string | null = null;

  for (const entry of sequence) {
    const city = entry.city.trim().toLowerCase();
    if (city === current) continue;
    if (completed.has(city)) return false; // returning to a city we already left
    if (current !== null) completed.add(current);
    current = city;
  }
  return true;
}

/**
 * Logistics agent. Produces where-to-stay, how-to-move, and a non-backtracking
 * day sequence. Validates feasibility deterministically (sequence + nights vs.
 * trip length) and reflects problems in its confidence score rather than failing.
 */
export class LogisticsAgent implements BaseAgent<TripConstraints, LogisticsPlan> {
  readonly name = "logistics";

  constructor(private readonly client: GeminiClient) {}

  async run(constraints: TripConstraints): Promise<AgentResult<LogisticsPlan>> {
    const data = getDestinationData(constraints.destination);
    const prompt = buildLogisticsPrompt(constraints, data);

    let plan: LogisticsPlan;
    try {
      plan = await this.client.generateStructured(prompt, LogisticsPlanSchema);
    } catch (err) {
      throw new AgentError(this.name, err);
    }

    const feasibleSequence = isNonBacktrackingSequence(plan.day_sequence);
    const totalNights = plan.stays.reduce((sum, s) => sum + s.nights, 0);
    // A feasible plan books roughly (duration - 1) nights and never more than the trip length.
    const nightsReasonable = totalNights > 0 && totalNights <= constraints.duration_days;

    let confidence = data ? 0.9 : 0.6;
    if (!feasibleSequence || !nightsReasonable) confidence = Math.min(confidence, 0.5);

    return {
      data: plan,
      confidence,
      citations: data ? [`grounding:${data.destination}`] : ["gemini-synthesized"],
    };
  }
}

export function createLogisticsAgent(client: GeminiClient): LogisticsAgent {
  return new LogisticsAgent(client);
}
