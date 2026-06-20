import { describe, it, expect, beforeEach } from "vitest";
import { saveTrip, listSavedTrips } from "@/lib/savedTrips";
import type { TripState } from "@/lib/types";

function trip(destination: string, days: number): TripState {
  return {
    constraints: {
      destination, duration_days: days, cities: ["Tokyo"], budget_usd: 3000, currency: "USD",
      preferences: [], avoidances: [], travelers: 1, pace: "moderate", clarifications_needed: [],
    },
    final_itinerary: [{ day: 1, city: "Tokyo", items: [{ title: "x", description: "y", category: "food", priority: "must-do", est_cost_usd: 0, time_block: "morning" }] }],
    has_caveats: false,
    caveats: [],
    replan_count: 0,
  };
}

describe("savedTrips", () => {
  beforeEach(() => localStorage.clear());

  it("returns an empty list initially", () => {
    expect(listSavedTrips()).toEqual([]);
  });

  it("saves a trip with a derived title and id", () => {
    const saved = saveTrip(trip("Japan", 5));
    expect(saved.title).toBe("5 days in Japan");
    expect(saved.id).toMatch(/^trip_/);
    expect(listSavedTrips()).toHaveLength(1);
  });

  it("prepends newer trips (newest first)", () => {
    saveTrip(trip("Japan", 5));
    saveTrip(trip("Italy", 7));
    const all = listSavedTrips();
    expect(all).toHaveLength(2);
    expect(all[0].title).toBe("7 days in Italy");
    expect(all[1].title).toBe("5 days in Japan");
  });
});
