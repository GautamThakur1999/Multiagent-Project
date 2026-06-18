import { describe, it, expect } from "vitest";
import { z } from "zod";
import { runPipeline, buildDraftItinerary } from "@/lib/agents/pipeline";
import { createMockGeminiClient } from "@/lib/gemini/mock";
import type { GeminiClient } from "@/lib/gemini/client";
import type {
  BudgetBreakdown,
  DestinationResearch,
  LogisticsPlan,
  TripConstraints,
} from "@/lib/types";

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

const DEST: DestinationResearch = {
  recommendations: [
    { name: "Tsukiji Outer Market", city: "Tokyo", category: "food", neighborhood: "Tsukiji", description: "Sushi breakfast.", priority: "must-do", crowd_level: "medium", off_peak_tip: "Go early.", est_cost_usd: 25 },
    { name: "Senso-ji", city: "Tokyo", category: "temple", neighborhood: "Asakusa", description: "Tokyo's oldest temple.", priority: "must-do", crowd_level: "high", off_peak_tip: "Dawn is empty.", est_cost_usd: 0 },
    { name: "Yanaka Ginza", city: "Tokyo", category: "food", neighborhood: "Yanaka", description: "Old-town snack street.", priority: "nice-to-have", crowd_level: "low", est_cost_usd: 15 },
    { name: "Meiji Shrine", city: "Tokyo", category: "temple", neighborhood: "Harajuku", description: "Forest shrine.", priority: "nice-to-have", crowd_level: "medium", est_cost_usd: 0 },
    { name: "Fushimi Inari", city: "Kyoto", category: "temple", neighborhood: "Fushimi", description: "Thousand torii gates.", priority: "must-do", crowd_level: "high", off_peak_tip: "Arrive at dawn.", est_cost_usd: 0 },
    { name: "Nishiki Market", city: "Kyoto", category: "food", neighborhood: "Nakagyo", description: "Kyoto's kitchen.", priority: "must-do", crowd_level: "medium", off_peak_tip: "Weekday mornings.", est_cost_usd: 20 },
    { name: "Sanzen-in", city: "Kyoto", category: "temple", neighborhood: "Ohara", description: "Quiet moss garden.", priority: "nice-to-have", crowd_level: "low", est_cost_usd: 6 },
  ],
};

const LOGI: LogisticsPlan = {
  stays: [
    { city: "Tokyo", neighborhood: "Yanaka", rationale: "Quiet & central.", price_range_usd_per_night: { min: 80, max: 150 }, nights: 2 },
    { city: "Kyoto", neighborhood: "Ohara", rationale: "Crowd-free.", price_range_usd_per_night: { min: 90, max: 170 }, nights: 2 },
  ],
  legs: [
    { from: "Tokyo", to: "Kyoto", mode: "Shinkansen (Nozomi)", duration_minutes: 135, est_cost_usd: 95, leg_type: "inter-city", booking_required: false, notes: "~2h15m." },
  ],
  day_sequence: [
    { day: 1, city: "Tokyo" },
    { day: 2, city: "Tokyo" },
    { day: 3, city: "Tokyo", note: "Transfer to Kyoto" },
    { day: 4, city: "Kyoto" },
    { day: 5, city: "Kyoto" },
  ],
};

const BUDGET_OK: BudgetBreakdown = { stay_usd: 560, transport_usd: 190, food_usd: 400, activities_usd: 100, total_usd: 0, within_budget: true };
const BUDGET_OVER: BudgetBreakdown = { stay_usd: 2800, transport_usd: 400, food_usd: 600, activities_usd: 300, total_usd: 0, within_budget: true, cheaper_alternatives: ["Stay in Asakusa instead of central Tokyo"] };

describe("runPipeline — full Japan request (happy path)", () => {
  it("produces a validated, review-passing 5-day itinerary within budget", async () => {
    const client = createMockGeminiClient([DEST, LOGI, BUDGET_OK]);
    const state = await runPipeline(japan(), client);

    // 5 days, both cities
    expect(state.final_itinerary).toHaveLength(5);
    const cities = new Set(state.final_itinerary!.map((d) => d.city));
    expect(cities).toEqual(new Set(["Tokyo", "Kyoto"]));

    // within budget
    expect(state.budget_breakdown?.total_usd).toBe(1250);
    expect(state.budget_breakdown?.within_budget).toBe(true);
    expect(state.budget_breakdown!.total_usd).toBeLessThanOrEqual(3000);

    // food + temple present
    const cats = new Set(state.final_itinerary!.flatMap((d) => d.items.map((i) => i.category)));
    expect(cats.has("food")).toBe(true);
    expect(cats.has("temple")).toBe(true);

    // review passed, no re-plan, Shinkansen surfaced
    expect(state.review_result?.overall).toBe("pass");
    expect(state.replan_count).toBe(0);
    expect(state.has_caveats).toBe(false);
    const allItems = state.final_itinerary!.flatMap((d) => d.items);
    expect(allItems.some((i) => /shinkansen/i.test(i.title))).toBe(true);
  });
});

describe("runPipeline — parallel fan-out", () => {
  it("runs the three specialists concurrently (overlapping in flight)", async () => {
    let inFlight = 0;
    let maxConcurrency = 0;
    let i = 0;
    const responses: unknown[] = [DEST, LOGI, BUDGET_OK];
    const trackingClient: GeminiClient = {
      async generateStructured<T>(_prompt: string, schema: z.ZodType<T>): Promise<T> {
        const myIdx = i++;
        inFlight++;
        maxConcurrency = Math.max(maxConcurrency, inFlight);
        await new Promise((r) => setTimeout(r, 5)); // hold so calls overlap
        inFlight--;
        return schema.parse(responses[myIdx]);
      },
    };

    const state = await runPipeline(japan(), trackingClient);

    expect(maxConcurrency).toBe(3); // all three specialists were in flight at once
    expect(state.review_result?.overall).toBe("pass");
  });
});

describe("runPipeline — bounded re-plan loop", () => {
  it("re-plans once when the first budget is over, then passes", async () => {
    const client = createMockGeminiClient([
      DEST, LOGI, BUDGET_OVER, // round 0 → over budget → review fail
      DEST, LOGI, BUDGET_OK, // round 1 → within budget → review pass
    ]);
    const state = await runPipeline(japan(), client);

    expect(state.replan_count).toBe(1);
    expect(state.review_result?.overall).toBe("pass");
    expect(state.budget_breakdown?.within_budget).toBe(true);
  });

  it("stops after maxReplans and delivers a best-effort plan with caveats", async () => {
    const client = createMockGeminiClient([
      DEST, LOGI, BUDGET_OVER, // round 0
      DEST, LOGI, BUDGET_OVER, // replan 1 (also fails)
    ]);
    const state = await runPipeline(japan(), client, { maxReplans: 1 });

    expect(state.replan_count).toBe(1);
    expect(state.review_result?.overall).toBe("fail");
    expect(state.has_caveats).toBe(true);
    expect(state.caveats.some((c) => /closest plan|couldn't satisfy/i.test(c))).toBe(true);
    // best-effort plan is still delivered
    expect(state.final_itinerary).toHaveLength(5);
  });
});

describe("runPipeline — graceful partial failure", () => {
  it("degrades with caveats when the destination agent fails", async () => {
    const client = createMockGeminiClient([
      new Error("destination agent down"),
      LOGI,
      BUDGET_OK,
    ]);
    const state = await runPipeline(japan(), client, { maxReplans: 0 });

    // Did not throw; produced a best-effort plan
    expect(state.final_itinerary).toHaveLength(5);
    expect(state.has_caveats).toBe(true);
    expect(state.caveats.some((c) => /recommendations were unavailable/i.test(c))).toBe(true);
    expect(state.replan_count).toBe(0);
  });
});

describe("buildDraftItinerary", () => {
  it("maps each day to its sequenced city and surfaces the inter-city leg", () => {
    const days = buildDraftItinerary(japan(), DEST, LOGI);
    expect(days).toHaveLength(5);
    expect(days.map((d) => d.city)).toEqual(["Tokyo", "Tokyo", "Tokyo", "Kyoto", "Kyoto"]);
    // every day has at least one item
    expect(days.every((d) => d.items.length >= 1)).toBe(true);
    // the transfer leg appears on the first Kyoto day
    const kyotoDay1 = days[3];
    expect(kyotoDay1.items.some((i) => /shinkansen/i.test(i.title))).toBe(true);
  });

  it("respects pace (slow = fewer items/day)", () => {
    const slow = buildDraftItinerary(japan({ pace: "slow" }), DEST, LOGI);
    // slow caps at 2 items/day; no day should exceed 2 recommendation slots (+transfer)
    expect(slow.every((d) => d.items.length <= 3)).toBe(true);
  });

  it("falls back to a free-time item when there are no recommendations", () => {
    const days = buildDraftItinerary(japan(), { recommendations: [] }, LOGI);
    expect(days).toHaveLength(5);
    expect(days.every((d) => d.items.length >= 1)).toBe(true);
    // days with no transfer leg fall back to an 'Explore' item
    expect(days[0].items[0].title).toMatch(/Explore Tokyo/);
  });
});
