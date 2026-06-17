import { describe, it, expect } from "vitest";
import {
  TripConstraintsSchema,
  TripStateSchema,
  ItineraryItemSchema,
  ItineraryDaySchema,
  StayRecommendationSchema,
  LogisticsLegSchema,
  BudgetBreakdownSchema,
  ReviewResultSchema,
  ReviewCheckSchema,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// TripConstraints
// ---------------------------------------------------------------------------

describe("TripConstraintsSchema", () => {
  const valid = {
    destination: "Japan",
    duration_days: 5,
    cities: ["Tokyo", "Kyoto"],
    budget_usd: 3000,
    preferences: ["food", "temples"],
    avoidances: ["crowds"],
  };

  it("parses a full valid input", () => {
    const result = TripConstraintsSchema.parse(valid);
    expect(result.destination).toBe("Japan");
    expect(result.cities).toEqual(["Tokyo", "Kyoto"]);
    expect(result.budget_usd).toBe(3000);
  });

  it("applies defaults for optional fields", () => {
    const result = TripConstraintsSchema.parse(valid);
    expect(result.currency).toBe("USD");
    expect(result.travelers).toBe(1);
    expect(result.pace).toBe("moderate");
    expect(result.clarifications_needed).toEqual([]);
  });

  it("accepts explicit optional fields", () => {
    const result = TripConstraintsSchema.parse({
      ...valid,
      currency: "JPY",
      travelers: 2,
      pace: "slow",
      clarifications_needed: ["What is your budget for flights?"],
    });
    expect(result.currency).toBe("JPY");
    expect(result.travelers).toBe(2);
    expect(result.pace).toBe("slow");
    expect(result.clarifications_needed).toHaveLength(1);
  });

  it("rejects missing destination", () => {
    const { destination: _d, ...rest } = valid;
    void _d;
    expect(() => TripConstraintsSchema.parse(rest)).toThrow();
  });

  it("rejects non-positive duration_days", () => {
    expect(() => TripConstraintsSchema.parse({ ...valid, duration_days: 0 })).toThrow();
    expect(() => TripConstraintsSchema.parse({ ...valid, duration_days: -1 })).toThrow();
  });

  it("rejects empty cities array", () => {
    expect(() => TripConstraintsSchema.parse({ ...valid, cities: [] })).toThrow();
  });

  it("rejects non-positive budget_usd", () => {
    expect(() => TripConstraintsSchema.parse({ ...valid, budget_usd: 0 })).toThrow();
  });

  it("rejects invalid pace value", () => {
    expect(() =>
      TripConstraintsSchema.parse({ ...valid, pace: "turbo" })
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// ItineraryItem
// ---------------------------------------------------------------------------

describe("ItineraryItemSchema", () => {
  const valid = {
    title: "Tsukiji Outer Market breakfast",
    description: "Fresh sushi and tamagoyaki at dawn.",
    category: "food" as const,
    priority: "must-do" as const,
    est_cost_usd: 25,
    time_block: "morning" as const,
  };

  it("parses a valid item", () => {
    const item = ItineraryItemSchema.parse(valid);
    expect(item.category).toBe("food");
    expect(item.priority).toBe("must-do");
  });

  it("accepts all optional fields", () => {
    const item = ItineraryItemSchema.parse({
      ...valid,
      location: "Tsukiji, Chuo, Tokyo",
      crowd_level: "medium",
      tips: "Go before 7am",
    });
    expect(item.crowd_level).toBe("medium");
    expect(item.tips).toBe("Go before 7am");
  });

  it("rejects invalid category", () => {
    expect(() => ItineraryItemSchema.parse({ ...valid, category: "shopping" })).toThrow();
  });

  it("rejects invalid priority", () => {
    expect(() => ItineraryItemSchema.parse({ ...valid, priority: "optional" })).toThrow();
  });

  it("rejects negative est_cost_usd", () => {
    expect(() => ItineraryItemSchema.parse({ ...valid, est_cost_usd: -5 })).toThrow();
  });

  it("rejects empty title", () => {
    expect(() => ItineraryItemSchema.parse({ ...valid, title: "" })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// ItineraryDay
// ---------------------------------------------------------------------------

describe("ItineraryDaySchema", () => {
  const item = {
    title: "Senso-ji Temple",
    description: "Arrive early.",
    category: "temple",
    priority: "must-do",
    est_cost_usd: 0,
    time_block: "morning",
  };

  it("parses a valid day", () => {
    const day = ItineraryDaySchema.parse({ day: 1, city: "Tokyo", items: [item] });
    expect(day.day).toBe(1);
    expect(day.items).toHaveLength(1);
  });

  it("rejects a day with no items", () => {
    expect(() => ItineraryDaySchema.parse({ day: 1, city: "Tokyo", items: [] })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// StayRecommendation
// ---------------------------------------------------------------------------

describe("StayRecommendationSchema", () => {
  const valid = {
    city: "Tokyo",
    neighborhood: "Asakusa",
    rationale: "Close to temples, cheaper than Shinjuku.",
    price_range_usd_per_night: { min: 80, max: 140 },
    nights: 2,
  };

  it("parses valid stay recommendation", () => {
    const stay = StayRecommendationSchema.parse(valid);
    expect(stay.neighborhood).toBe("Asakusa");
    expect(stay.nights).toBe(2);
  });

  it("rejects negative price range", () => {
    expect(() =>
      StayRecommendationSchema.parse({
        ...valid,
        price_range_usd_per_night: { min: -10, max: 140 },
      })
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// LogisticsLeg
// ---------------------------------------------------------------------------

describe("LogisticsLegSchema", () => {
  const valid = {
    from: "Tokyo",
    to: "Kyoto",
    mode: "Shinkansen",
    duration_minutes: 135,
    est_cost_usd: 140,
    leg_type: "inter-city" as const,
  };

  it("parses a valid leg", () => {
    const leg = LogisticsLegSchema.parse(valid);
    expect(leg.mode).toBe("Shinkansen");
    expect(leg.duration_minutes).toBe(135);
  });

  it("rejects invalid leg_type", () => {
    expect(() => LogisticsLegSchema.parse({ ...valid, leg_type: "air" })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// BudgetBreakdown
// ---------------------------------------------------------------------------

describe("BudgetBreakdownSchema", () => {
  const valid = {
    stay_usd: 560,
    transport_usd: 200,
    food_usd: 400,
    activities_usd: 90,
    total_usd: 1250,
    within_budget: true,
  };

  it("parses a within-budget breakdown", () => {
    const b = BudgetBreakdownSchema.parse(valid);
    expect(b.within_budget).toBe(true);
    expect(b.total_usd).toBe(1250);
  });

  it("parses an over-budget breakdown with alternatives", () => {
    const b = BudgetBreakdownSchema.parse({
      ...valid,
      total_usd: 3400,
      within_budget: false,
      overspend_usd: 400,
      cheaper_alternatives: ["Stay in Asakusa instead of Shinjuku"],
    });
    expect(b.within_budget).toBe(false);
    expect(b.overspend_usd).toBe(400);
    expect(b.cheaper_alternatives).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// ReviewResult
// ---------------------------------------------------------------------------

describe("ReviewResultSchema", () => {
  const passingCheck = {
    check: "fits_duration",
    status: "pass" as const,
    reason: "Plan spans exactly 5 days.",
  };

  const failingCheck = {
    check: "within_budget",
    status: "fail" as const,
    reason: "Estimated total $3,400 exceeds $3,000 budget.",
    suggested_fix: "Swap central Tokyo hotel for Asakusa area.",
  };

  it("parses a passing review", () => {
    const r = ReviewResultSchema.parse({
      overall: "pass",
      checks: [passingCheck],
    });
    expect(r.overall).toBe("pass");
  });

  it("parses a failing review with caveats", () => {
    const r = ReviewResultSchema.parse({
      overall: "fail",
      checks: [passingCheck, failingCheck],
      caveats: ["Budget slightly over — best-effort plan provided."],
    });
    expect(r.overall).toBe("fail");
    expect(r.checks).toHaveLength(2);
    expect(r.caveats).toHaveLength(1);
  });

  it("rejects invalid check status", () => {
    expect(() =>
      ReviewCheckSchema.parse({ ...passingCheck, status: "skipped" })
    ).toThrow();
  });

  it("rejects invalid overall value", () => {
    expect(() =>
      ReviewResultSchema.parse({ overall: "maybe", checks: [] })
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// TripState
// ---------------------------------------------------------------------------

describe("TripStateSchema", () => {
  const constraints = {
    destination: "Japan",
    duration_days: 5,
    cities: ["Tokyo", "Kyoto"],
    budget_usd: 3000,
    preferences: ["food", "temples"],
    avoidances: ["crowds"],
  };

  it("parses minimal state (just constraints)", () => {
    const state = TripStateSchema.parse({ constraints });
    expect(state.constraints.destination).toBe("Japan");
    expect(state.final_itinerary).toBeUndefined();
    expect(state.has_caveats).toBe(false);
    expect(state.replan_count).toBe(0);
  });

  it("parses state with optional fields populated", () => {
    const state = TripStateSchema.parse({
      constraints,
      has_caveats: true,
      caveats: ["Budget slightly exceeded — best-effort plan provided."],
      replan_count: 1,
    });
    expect(state.has_caveats).toBe(true);
    expect(state.replan_count).toBe(1);
  });
});
