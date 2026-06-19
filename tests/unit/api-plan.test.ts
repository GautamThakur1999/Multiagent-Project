import { describe, it, expect } from "vitest";
import {
  validatePlanBody,
  streamPlan,
  formatSSE,
  type PlanEvent,
} from "@/lib/api/plan";
import { createMockGeminiClient } from "@/lib/gemini/mock";
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
    { name: "Tsukiji Outer Market", city: "Tokyo", category: "food", description: "Sushi.", priority: "must-do", crowd_level: "medium", off_peak_tip: "Go early.", est_cost_usd: 25 },
    { name: "Senso-ji", city: "Tokyo", category: "temple", description: "Temple.", priority: "must-do", crowd_level: "high", off_peak_tip: "Dawn.", est_cost_usd: 0 },
    { name: "Fushimi Inari", city: "Kyoto", category: "temple", description: "Torii.", priority: "must-do", crowd_level: "high", off_peak_tip: "Dawn.", est_cost_usd: 0 },
    { name: "Nishiki Market", city: "Kyoto", category: "food", description: "Market.", priority: "must-do", crowd_level: "medium", off_peak_tip: "Weekdays.", est_cost_usd: 20 },
  ],
};

const LOGI: LogisticsPlan = {
  stays: [
    { city: "Tokyo", neighborhood: "Yanaka", rationale: "Quiet.", price_range_usd_per_night: { min: 80, max: 150 }, nights: 2 },
    { city: "Kyoto", neighborhood: "Ohara", rationale: "Quiet.", price_range_usd_per_night: { min: 90, max: 170 }, nights: 2 },
  ],
  legs: [
    { from: "Tokyo", to: "Kyoto", mode: "Shinkansen", duration_minutes: 135, est_cost_usd: 95, leg_type: "inter-city" },
  ],
  day_sequence: [
    { day: 1, city: "Tokyo" },
    { day: 2, city: "Tokyo" },
    { day: 3, city: "Tokyo" },
    { day: 4, city: "Kyoto" },
    { day: 5, city: "Kyoto" },
  ],
};

const BUDGET_OK: BudgetBreakdown = {
  stay_usd: 560, transport_usd: 190, food_usd: 400, activities_usd: 100, total_usd: 0, within_budget: true,
};

describe("validatePlanBody", () => {
  it("accepts a valid constraints body", () => {
    const r = validatePlanBody({ constraints: japan() });
    expect(r.ok).toBe(true);
  });

  it("rejects a missing/invalid constraints body with 400", () => {
    expect(validatePlanBody({}).ok).toBe(false);
    const bad = validatePlanBody({ constraints: { destination: "Japan" } });
    expect(bad).toMatchObject({ ok: false, status: 400 });
  });
});

describe("streamPlan — SSE event sequence", () => {
  it("emits ordered progress events then a terminal itinerary event", async () => {
    const client = createMockGeminiClient([DEST, LOGI, BUDGET_OK]);
    const events: PlanEvent[] = [];
    await streamPlan(japan(), client, (e) => events.push(e), {});

    const progress = events
      .filter((e) => e.event === "progress")
      .map((e) => `${(e.data as { stage: string }).stage}:${(e.data as { status: string }).status}`);

    // 1) orchestrator opens the stream
    expect(progress[0]).toBe("orchestrator:started");
    // 2) all three specialists start (parallel group — order within group not asserted)
    expect(progress.slice(1, 4).sort()).toEqual([
      "budget:started",
      "destination:started",
      "logistics:started",
    ]);
    // 3) all three specialists finish
    expect(progress.slice(4, 7).sort()).toEqual([
      "budget:done",
      "destination:done",
      "logistics:done",
    ]);
    // 4) review runs, then orchestrator closes
    expect(progress.slice(7)).toEqual(["review:started", "review:done", "orchestrator:done"]);

    // terminal event is the itinerary, and it is last
    const last = events[events.length - 1];
    expect(last.event).toBe("itinerary");
    expect(events.filter((e) => e.event === "itinerary")).toHaveLength(1);
    expect(events.some((e) => e.event === "error")).toBe(false);
  });

  it("the itinerary event carries a complete, review-passing TripState", async () => {
    const client = createMockGeminiClient([DEST, LOGI, BUDGET_OK]);
    const events: PlanEvent[] = [];
    await streamPlan(japan(), client, (e) => events.push(e), {});

    const itinerary = events.find((e) => e.event === "itinerary");
    if (!itinerary || itinerary.event !== "itinerary") throw new Error("no itinerary event");
    expect(itinerary.data.final_itinerary).toHaveLength(5);
    expect(itinerary.data.review_result?.overall).toBe("pass");
    expect(itinerary.data.budget_breakdown?.total_usd).toBe(1250);
  });
});

describe("formatSSE", () => {
  it("serializes a progress event as a valid SSE frame", () => {
    const frame = formatSSE({ event: "progress", data: { stage: "destination", status: "started" } });
    expect(frame).toBe('event: progress\ndata: {"stage":"destination","status":"started"}\n\n');
  });

  it("serializes itinerary and error events", () => {
    expect(formatSSE({ event: "error", data: { error: "planning_error", message: "boom" } })).toBe(
      'event: error\ndata: {"error":"planning_error","message":"boom"}\n\n'
    );
  });
});
