import { describe, it, expect, vi } from "vitest";
import {
  destinationCacheKey,
  createInMemoryDestinationCache,
  CachingDestinationAgent,
} from "@/lib/agents/destinationCache";
import type { AgentResult, BaseAgent } from "@/lib/agents/base";
import type { DestinationResearch, TripConstraints } from "@/lib/types";

function japan(overrides: Partial<TripConstraints> = {}): TripConstraints {
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

const RESEARCH: DestinationResearch = {
  recommendations: [
    { name: "Senso-ji", city: "Tokyo", category: "temple", description: "Temple.", priority: "must-do", crowd_level: "high", est_cost_usd: 0 },
  ],
};

describe("destinationCacheKey", () => {
  it("is order-insensitive across cities / preferences / avoidances", () => {
    const a = destinationCacheKey(japan({ cities: ["Tokyo", "Kyoto"], preferences: ["food", "temples"] }));
    const b = destinationCacheKey(japan({ cities: ["Kyoto", "Tokyo"], preferences: ["temples", "food"] }));
    expect(a).toBe(b);
  });

  it("differs when the destination or taste changes", () => {
    const base = destinationCacheKey(japan());
    expect(destinationCacheKey(japan({ destination: "Italy" }))).not.toBe(base);
    expect(destinationCacheKey(japan({ preferences: ["nightlife"] }))).not.toBe(base);
  });

  it("ignores fields that don't affect recommendations (budget, duration)", () => {
    const base = destinationCacheKey(japan());
    expect(destinationCacheKey(japan({ budget_usd: 9999, duration_days: 10 }))).toBe(base);
  });
});

describe("createInMemoryDestinationCache", () => {
  it("stores, retrieves, and clears", () => {
    const cache = createInMemoryDestinationCache();
    expect(cache.get("k")).toBeUndefined();
    cache.set("k", RESEARCH);
    expect(cache.get("k")).toBe(RESEARCH);
    cache.clear();
    expect(cache.get("k")).toBeUndefined();
  });
});

describe("CachingDestinationAgent", () => {
  it("calls the inner agent on a miss, then serves from cache on a hit", async () => {
    const run = vi.fn(
      async (): Promise<AgentResult<DestinationResearch>> => ({
        data: RESEARCH,
        confidence: 0.9,
        citations: ["grounding:Japan"],
      })
    );
    const inner: BaseAgent<TripConstraints, DestinationResearch> = {
      name: "destination-research",
      run,
    };
    const cache = createInMemoryDestinationCache();
    const agent = new CachingDestinationAgent(inner, cache);

    const first = await agent.run(japan());
    const second = await agent.run(japan());

    expect(run).toHaveBeenCalledTimes(1); // second call was a cache hit
    expect(first.data).toBe(RESEARCH);
    expect(second.data).toBe(RESEARCH);
    expect(second.citations).toContain("cache");
  });

  it("misses for differing taste and calls the inner agent again", async () => {
    const run = vi.fn(
      async (): Promise<AgentResult<DestinationResearch>> => ({ data: RESEARCH, confidence: 0.9 })
    );
    const inner: BaseAgent<TripConstraints, DestinationResearch> = { name: "destination-research", run };
    const agent = new CachingDestinationAgent(inner, createInMemoryDestinationCache());

    await agent.run(japan({ preferences: ["food"] }));
    await agent.run(japan({ preferences: ["nightlife"] }));

    expect(run).toHaveBeenCalledTimes(2);
  });
});
