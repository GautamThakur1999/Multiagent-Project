import { describe, it, expect } from "vitest";
import { encodeTripState, decodeTripState } from "@/lib/shareLink";
import type { TripState } from "@/lib/types";

const STATE: TripState = {
  constraints: {
    destination: "Japan", duration_days: 5, cities: ["Tokyo", "Kyoto"], budget_usd: 3000, currency: "USD",
    preferences: ["food", "temples"], avoidances: ["crowds"], travelers: 1, pace: "moderate", clarifications_needed: [],
  },
  final_itinerary: [
    { day: 1, city: "Tokyo", items: [{ title: "Senso-ji", description: "Temple.", category: "temple", priority: "must-do", est_cost_usd: 0, time_block: "morning" }] },
  ],
  has_caveats: false,
  caveats: [],
  replan_count: 0,
};

describe("shareLink", () => {
  it("round-trips a TripState through encode/decode", () => {
    const encoded = encodeTripState(STATE);
    expect(typeof encoded).toBe("string");
    expect(encoded).not.toMatch(/[/+=]/); // URL-safe
    expect(decodeTripState(encoded)).toEqual(STATE);
  });

  it("returns null for a corrupt payload", () => {
    expect(decodeTripState("!!!not-base64!!!")).toBeNull();
  });
});
