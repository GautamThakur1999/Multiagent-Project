import { describe, it, expect } from "vitest";
import { BudgetAgent, createBudgetAgent } from "@/lib/agents/budget";
import { createMockGeminiClient } from "@/lib/gemini/mock";
import { buildBudgetPrompt } from "@/lib/prompts/budget";
import { getDestinationData } from "@/lib/data/japan";
import { AgentError } from "@/lib/agents/base";
import type { BudgetBreakdown, TripConstraints } from "@/lib/types";

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

describe("BudgetAgent — deterministic re-derivation", () => {
  it("recomputes total from categories and flags within budget", async () => {
    const mock: BudgetBreakdown = {
      stay_usd: 560,
      transport_usd: 190,
      food_usd: 400,
      activities_usd: 100,
      total_usd: 99999, // deliberately wrong — agent must ignore it
      within_budget: false, // deliberately wrong
    };
    const client = createMockGeminiClient([mock]);
    const agent = new BudgetAgent(client);

    const { data } = await agent.run(japanConstraints({ budget_usd: 3000 }));

    expect(data.total_usd).toBe(1250);
    expect(data.within_budget).toBe(true);
    expect(data.overspend_usd).toBeUndefined();
  });

  it("flags overspend and computes the overage even if the model says within budget", async () => {
    const mock: BudgetBreakdown = {
      stay_usd: 2800,
      transport_usd: 400,
      food_usd: 600,
      activities_usd: 300,
      total_usd: 100, // wrong
      within_budget: true, // wrong
      cheaper_alternatives: ["Stay in Asakusa instead of central Tokyo"],
    };
    const client = createMockGeminiClient([mock]);
    const agent = createBudgetAgent(client);

    const { data } = await agent.run(japanConstraints({ budget_usd: 3000 }));

    expect(data.total_usd).toBe(4100);
    expect(data.within_budget).toBe(false);
    expect(data.overspend_usd).toBe(1100);
    expect(data.cheaper_alternatives).toContain("Stay in Asakusa instead of central Tokyo");
  });

  it("adds a USD note when the budget currency is not USD", async () => {
    const mock: BudgetBreakdown = {
      stay_usd: 500,
      transport_usd: 100,
      food_usd: 200,
      activities_usd: 50,
      total_usd: 850,
      within_budget: true,
    };
    const client = createMockGeminiClient([mock]);
    const agent = new BudgetAgent(client);

    const { data } = await agent.run(japanConstraints({ currency: "JPY" }));
    expect(data.notes).toMatch(/USD/);
    expect(data.notes).toMatch(/JPY/);
  });

  it("wraps downstream failures in an AgentError", async () => {
    const client = createMockGeminiClient([new Error("model exploded")]);
    const agent = new BudgetAgent(client);
    await expect(agent.run(japanConstraints())).rejects.toBeInstanceOf(AgentError);
  });
});

describe("buildBudgetPrompt", () => {
  it("embeds the budget, party size, and grounding prices", () => {
    const prompt = buildBudgetPrompt(japanConstraints(), getDestinationData("Japan"));
    expect(prompt).toContain("3000");
    expect(prompt).toMatch(/Shinkansen/i);
    expect(prompt).toMatch(/JSON only/i);
  });
});
