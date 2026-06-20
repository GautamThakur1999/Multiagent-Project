import { describe, it, expect } from "vitest";
import { handleRegenerateDay, handleCheaper, makeCheaper } from "@/lib/api/edit";
import { createMockGeminiClient } from "@/lib/gemini/mock";
import type { BudgetBreakdown, DestinationResearch, LogisticsPlan, TripConstraints } from "@/lib/types";

const CONSTRAINTS: TripConstraints = {
  destination: "Japan", duration_days: 5, cities: ["Tokyo", "Kyoto"], budget_usd: 3000, currency: "USD",
  preferences: ["food", "temples"], avoidances: ["crowds"], travelers: 1, pace: "moderate", clarifications_needed: [],
};

const DEST: DestinationResearch = {
  recommendations: [
    { name: "Tsukiji Market", city: "Tokyo", category: "food", description: "Sushi.", priority: "must-do", crowd_level: "medium", off_peak_tip: "Early.", est_cost_usd: 25 },
    { name: "Senso-ji", city: "Tokyo", category: "temple", description: "Temple.", priority: "must-do", crowd_level: "high", off_peak_tip: "Dawn.", est_cost_usd: 0 },
    { name: "Fushimi Inari", city: "Kyoto", category: "temple", description: "Torii.", priority: "must-do", crowd_level: "high", off_peak_tip: "Dawn.", est_cost_usd: 0 },
    { name: "Nishiki Market", city: "Kyoto", category: "food", description: "Market.", priority: "must-do", crowd_level: "medium", off_peak_tip: "Weekday.", est_cost_usd: 20 },
  ],
};

const LOGI: LogisticsPlan = {
  stays: [
    { city: "Tokyo", neighborhood: "Yanaka", rationale: "Quiet.", price_range_usd_per_night: { min: 80, max: 150 }, nights: 2 },
    { city: "Kyoto", neighborhood: "Ohara", rationale: "Quiet.", price_range_usd_per_night: { min: 90, max: 170 }, nights: 2 },
  ],
  legs: [{ from: "Tokyo", to: "Kyoto", mode: "Shinkansen", duration_minutes: 135, est_cost_usd: 95, leg_type: "inter-city" }],
  day_sequence: [
    { day: 1, city: "Tokyo" }, { day: 2, city: "Tokyo" }, { day: 3, city: "Tokyo" },
    { day: 4, city: "Kyoto" }, { day: 5, city: "Kyoto" },
  ],
};

const BUDGET: BudgetBreakdown = { stay_usd: 560, transport_usd: 190, food_usd: 400, activities_usd: 100, total_usd: 0, within_budget: true };

function pipelineResponses() {
  return [DEST, LOGI, BUDGET];
}

describe("makeCheaper", () => {
  it("re-plans against a reduced budget but restores the original budget for display", async () => {
    const client = createMockGeminiClient(pipelineResponses());
    const state = await makeCheaper(CONSTRAINTS, client);
    expect(state.constraints.budget_usd).toBe(3000); // restored
    expect(state.final_itinerary).toHaveLength(5);
  });
});

describe("handleRegenerateDay", () => {
  it("returns the regenerated day", async () => {
    const client = createMockGeminiClient(pipelineResponses());
    const res = await handleRegenerateDay({ constraints: CONSTRAINTS, day: 2 }, client);
    expect(res.status).toBe(200);
    expect("day" in res.body && res.body.day.day).toBe(2);
  });

  it("rejects a malformed body with 400", async () => {
    const client = createMockGeminiClient([]);
    const res = await handleRegenerateDay({ constraints: CONSTRAINTS }, client);
    expect(res.status).toBe(400);
  });
});

describe("handleCheaper", () => {
  it("returns a cheaper full TripState", async () => {
    const client = createMockGeminiClient(pipelineResponses());
    const res = await handleCheaper({ constraints: CONSTRAINTS }, client);
    expect(res.status).toBe(200);
    expect("state" in res.body && res.body.state.final_itinerary).toHaveLength(5);
  });

  it("rejects a malformed body with 400", async () => {
    const client = createMockGeminiClient([]);
    const res = await handleCheaper({ notConstraints: true }, client);
    expect(res.status).toBe(400);
  });
});
