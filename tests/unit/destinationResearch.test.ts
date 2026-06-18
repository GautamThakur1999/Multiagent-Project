import { describe, it, expect } from "vitest";
import {
  DestinationResearchAgent,
  createDestinationResearchAgent,
  sortByCrowdAscending,
  avoidsCrowds,
} from "@/lib/agents/destinationResearch";
import { createMockGeminiClient } from "@/lib/gemini/mock";
import { buildDestinationResearchPrompt } from "@/lib/prompts/destinationResearch";
import { getDestinationData } from "@/lib/data/japan";
import { AgentError } from "@/lib/agents/base";
import type { DestinationResearch, TripConstraints } from "@/lib/types";

function japanConstraints(overrides: Partial<TripConstraints> = {}): TripConstraints {
  return {
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
    ...overrides,
  };
}

// Mixed-crowd fixture (high, low, medium) so sorting is observable.
const MIXED_RESEARCH: DestinationResearch = {
  recommendations: [
    {
      name: "Fushimi Inari Taisha",
      city: "Kyoto",
      category: "temple",
      description: "Thousand torii gates.",
      priority: "must-do",
      crowd_level: "high",
      best_time: "Before 8am",
      off_peak_tip: "Arrive at dawn.",
      est_cost_usd: 0,
    },
    {
      name: "Sanzen-in Temple",
      city: "Kyoto",
      category: "temple",
      description: "Quiet moss garden in Ohara.",
      priority: "nice-to-have",
      crowd_level: "low",
      est_cost_usd: 6,
    },
    {
      name: "Nishiki Market",
      city: "Kyoto",
      category: "food",
      description: "Kyoto's kitchen.",
      priority: "must-do",
      crowd_level: "medium",
      off_peak_tip: "Weekday late mornings.",
      est_cost_usd: 20,
    },
  ],
  summary: "Food and temples, crowd-aware.",
};

describe("DestinationResearchAgent — crowd avoidance", () => {
  it("reorders results quietest-first when the traveler avoids crowds", async () => {
    const client = createMockGeminiClient([MIXED_RESEARCH]);
    const agent = new DestinationResearchAgent(client);

    const { data } = await agent.run(japanConstraints({ avoidances: ["crowds"] }));

    expect(data.recommendations.map((r) => r.crowd_level)).toEqual([
      "low",
      "medium",
      "high",
    ]);
    expect(data.recommendations[0].name).toBe("Sanzen-in Temple");
  });

  it("preserves the model's order when crowds are not avoided", async () => {
    const client = createMockGeminiClient([MIXED_RESEARCH]);
    const agent = new DestinationResearchAgent(client);

    const { data } = await agent.run(japanConstraints({ avoidances: [] }));

    expect(data.recommendations.map((r) => r.name)).toEqual([
      "Fushimi Inari Taisha",
      "Sanzen-in Temple",
      "Nishiki Market",
    ]);
  });

  it("lowers confidence when a high-crowd must-do has no off-peak mitigation", async () => {
    const unmitigated: DestinationResearch = {
      recommendations: [
        {
          name: "Crowded Must-See",
          city: "Tokyo",
          category: "experience",
          description: "Packed, no tip given.",
          priority: "must-do",
          crowd_level: "high",
          est_cost_usd: 30,
        },
      ],
    };
    const client = createMockGeminiClient([unmitigated]);
    const agent = new DestinationResearchAgent(client);

    const { confidence } = await agent.run(japanConstraints({ avoidances: ["crowds"] }));
    expect(confidence).toBeLessThanOrEqual(0.7);
  });
});

describe("DestinationResearchAgent — output & metadata", () => {
  it("returns preference-aligned items each tagged with priority and crowd level", async () => {
    const client = createMockGeminiClient([MIXED_RESEARCH]);
    const agent = createDestinationResearchAgent(client);

    const { data, citations } = await agent.run(japanConstraints());

    for (const rec of data.recommendations) {
      expect(["must-do", "nice-to-have"]).toContain(rec.priority);
      expect(["low", "medium", "high"]).toContain(rec.crowd_level);
    }
    expect(citations).toContain("grounding:Japan");
  });

  it("wraps downstream failures in an AgentError", async () => {
    const client = createMockGeminiClient([new Error("model exploded")]);
    const agent = new DestinationResearchAgent(client);

    await expect(agent.run(japanConstraints())).rejects.toBeInstanceOf(AgentError);
  });
});

describe("destination research helpers", () => {
  it("avoidsCrowds detects crowd-related avoidances", () => {
    expect(avoidsCrowds(japanConstraints({ avoidances: ["crowds"] }))).toBe(true);
    expect(avoidsCrowds(japanConstraints({ avoidances: ["crowded places"] }))).toBe(true);
    expect(avoidsCrowds(japanConstraints({ avoidances: ["rain"] }))).toBe(false);
  });

  it("sortByCrowdAscending is stable and non-mutating", () => {
    const input = MIXED_RESEARCH.recommendations;
    const sorted = sortByCrowdAscending(input);
    expect(sorted.map((r) => r.crowd_level)).toEqual(["low", "medium", "high"]);
    // original untouched
    expect(input.map((r) => r.crowd_level)).toEqual(["high", "low", "medium"]);
  });

  it("buildDestinationResearchPrompt embeds grounding + avoidances", () => {
    const prompt = buildDestinationResearchPrompt(
      japanConstraints(),
      getDestinationData("Japan")
    );
    expect(prompt).toContain("Fushimi Inari");
    expect(prompt).toMatch(/crowd/i);
    expect(prompt).toContain("food, temples");
  });
});
