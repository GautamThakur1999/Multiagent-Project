import type { GeminiClient } from "@/lib/gemini/client";
import {
  type CrowdLevel,
  type DestinationResearch,
  DestinationResearchSchema,
  type TripConstraints,
} from "@/lib/types";
import { getDestinationData } from "@/lib/data/japan";
import { buildDestinationResearchPrompt } from "@/lib/prompts/destinationResearch";
import { type AgentResult, type BaseAgent, AgentError } from "./base";

const CROWD_ORDER: Record<CrowdLevel, number> = { low: 0, medium: 1, high: 2 };

/** True if the traveler asked to avoid crowds. */
export function avoidsCrowds(constraints: TripConstraints): boolean {
  return constraints.avoidances.some((a) => /crowd/i.test(a));
}

/** Stable-sorts recommendations so lower-crowd options come first. */
export function sortByCrowdAscending(
  recs: DestinationResearch["recommendations"]
): DestinationResearch["recommendations"] {
  return [...recs].sort((a, b) => CROWD_ORDER[a.crowd_level] - CROWD_ORDER[b.crowd_level]);
}

function hasUnmitigatedCrowding(research: DestinationResearch): boolean {
  return research.recommendations.some(
    (r) => r.priority === "must-do" && r.crowd_level === "high" && !r.off_peak_tip
  );
}

/**
 * Destination Research agent. Produces preference-aligned, crowd-aware
 * recommendations grounded in the destination data. When the traveler avoids
 * crowds, it reorders results to surface quieter options first and lowers its
 * confidence if any high-crowd must-do lacks an off-peak mitigation.
 */
export class DestinationResearchAgent
  implements BaseAgent<TripConstraints, DestinationResearch>
{
  readonly name = "destination-research";

  constructor(private readonly client: GeminiClient) {}

  async run(constraints: TripConstraints): Promise<AgentResult<DestinationResearch>> {
    const data = getDestinationData(constraints.destination);
    const prompt = buildDestinationResearchPrompt(constraints, data);

    let research: DestinationResearch;
    try {
      research = await this.client.generateStructured(prompt, DestinationResearchSchema);
    } catch (err) {
      throw new AgentError(this.name, err);
    }

    const wantsQuiet = avoidsCrowds(constraints);
    const recommendations = wantsQuiet
      ? sortByCrowdAscending(research.recommendations)
      : research.recommendations;
    const result: DestinationResearch = { ...research, recommendations };

    let confidence = data ? 0.9 : 0.6;
    if (wantsQuiet && hasUnmitigatedCrowding(result)) {
      confidence = Math.min(confidence, 0.7);
    }

    return {
      data: result,
      confidence,
      citations: data ? [`grounding:${data.destination}`] : ["gemini-synthesized"],
    };
  }
}

export function createDestinationResearchAgent(
  client: GeminiClient
): DestinationResearchAgent {
  return new DestinationResearchAgent(client);
}
