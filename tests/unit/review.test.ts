import { describe, it, expect } from "vitest";
import { ReviewAgent, type ReviewInput } from "@/lib/agents/review";
import type {
  BudgetBreakdown,
  ItineraryDay,
  LogisticsPlan,
  TripConstraints,
} from "@/lib/types";

function constraints(overrides: Partial<TripConstraints> = {}): TripConstraints {
  return {
    destination: "Japan",
    duration_days: 2,
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

// A compliant 2-day, both-cities itinerary with food + temple, crowd-mitigated.
function goodItinerary(): ItineraryDay[] {
  return [
    {
      day: 1,
      city: "Tokyo",
      items: [
        {
          title: "Senso-ji",
          description: "Temple",
          category: "temple",
          priority: "must-do",
          est_cost_usd: 0,
          time_block: "morning",
          crowd_level: "high",
          tips: "Go at dawn",
        },
        {
          title: "Tsukiji",
          description: "Food market",
          category: "food",
          priority: "must-do",
          est_cost_usd: 25,
          time_block: "afternoon",
          crowd_level: "medium",
        },
      ],
    },
    {
      day: 2,
      city: "Kyoto",
      items: [
        {
          title: "Nishiki",
          description: "Food market",
          category: "food",
          priority: "must-do",
          est_cost_usd: 20,
          time_block: "morning",
          crowd_level: "medium",
        },
      ],
    },
  ];
}

const goodBudget: BudgetBreakdown = {
  stay_usd: 400,
  transport_usd: 190,
  food_usd: 300,
  activities_usd: 60,
  total_usd: 950,
  within_budget: true,
};

const goodLogistics: LogisticsPlan = {
  stays: [
    {
      city: "Tokyo",
      neighborhood: "Yanaka",
      rationale: "Quiet",
      price_range_usd_per_night: { min: 80, max: 150 },
      nights: 1,
    },
  ],
  legs: [
    {
      from: "Tokyo",
      to: "Kyoto",
      mode: "Shinkansen",
      duration_minutes: 135,
      est_cost_usd: 95,
      leg_type: "inter-city",
    },
  ],
  day_sequence: [
    { day: 1, city: "Tokyo" },
    { day: 2, city: "Kyoto" },
  ],
};

function input(overrides: Partial<ReviewInput> = {}): ReviewInput {
  return {
    constraints: constraints(),
    itinerary: goodItinerary(),
    budget: goodBudget,
    logistics: goodLogistics,
    ...overrides,
  };
}

describe("ReviewAgent — all six checks", () => {
  it("passes a fully compliant plan", () => {
    const result = new ReviewAgent().review(input());
    expect(result.overall).toBe("pass");
    expect(result.checks).toHaveLength(6);
    expect(result.caveats).toBeUndefined();
  });

  it("fails when the day count does not match the duration", () => {
    const result = new ReviewAgent().review(
      input({ constraints: constraints({ duration_days: 5 }) })
    );
    expect(result.overall).toBe("fail");
    expect(result.checks.find((c) => c.check === "fits_duration")?.status).toBe("fail");
  });

  it("fails when a requested city is missing", () => {
    const tokyoOnly = [goodItinerary()[0]]; // drop Kyoto day
    const result = new ReviewAgent().review({ ...input(), itinerary: tokyoOnly, constraints: constraints({ duration_days: 1 }) });
    const cityCheck = result.checks.find((c) => c.check === "includes_all_cities");
    expect(cityCheck?.status).toBe("fail");
    expect(cityCheck?.reason).toMatch(/Kyoto/);
  });

  it("fails when over budget", () => {
    const overBudget: BudgetBreakdown = { ...goodBudget, total_usd: 4200, within_budget: false };
    const result = new ReviewAgent().review(input({ budget: overBudget }));
    expect(result.overall).toBe("fail");
    expect(result.checks.find((c) => c.check === "within_budget")?.status).toBe("fail");
  });

  it("fails when a stated preference is not reflected", () => {
    const result = new ReviewAgent().review(
      input({ constraints: constraints({ preferences: ["nightlife"] }) })
    );
    const pref = result.checks.find((c) => c.check === "matches_preferences");
    expect(pref?.status).toBe("fail");
    expect(pref?.reason).toMatch(/nightlife/);
  });

  it("warns (not fails) when crowd avoidance is only partial", () => {
    const crowded = goodItinerary();
    crowded[0].items[0].tips = undefined; // high-crowd must-do now has no off-peak tip
    const result = new ReviewAgent().review(input({ itinerary: crowded }));
    const crowd = result.checks.find((c) => c.check === "avoids_crowds");
    expect(crowd?.status).toBe("warning");
    expect(result.overall).toBe("pass"); // warning does not fail the plan
  });

  it("fails when the city sequence backtracks", () => {
    const backtracking: LogisticsPlan = {
      ...goodLogistics,
      day_sequence: [
        { day: 1, city: "Tokyo" },
        { day: 2, city: "Kyoto" },
        { day: 3, city: "Tokyo" },
      ],
    };
    const result = new ReviewAgent().review(input({ logistics: backtracking }));
    expect(result.checks.find((c) => c.check === "travel_time_realistic")?.status).toBe("fail");
    expect(result.overall).toBe("fail");
  });

  it("passes crowd check when no crowd avoidance was requested", () => {
    const result = new ReviewAgent().review(
      input({ constraints: constraints({ avoidances: [] }) })
    );
    expect(result.checks.find((c) => c.check === "avoids_crowds")?.status).toBe("pass");
  });
});
