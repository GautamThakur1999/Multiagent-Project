import { describe, it, expect } from "vitest";
import {
  LogisticsAgent,
  createLogisticsAgent,
  isNonBacktrackingSequence,
} from "@/lib/agents/logistics";
import { createMockGeminiClient } from "@/lib/gemini/mock";
import { buildLogisticsPrompt } from "@/lib/prompts/logistics";
import { getDestinationData } from "@/lib/data/japan";
import { AgentError } from "@/lib/agents/base";
import type { LogisticsPlan, TripConstraints } from "@/lib/types";

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

// A feasible 5-day Tokyo→Kyoto plan: 2+2 nights, Shinkansen, contiguous days.
const FEASIBLE_PLAN: LogisticsPlan = {
  stays: [
    {
      city: "Tokyo",
      neighborhood: "Yanaka",
      rationale: "Quiet, cheap, temple-rich.",
      price_range_usd_per_night: { min: 80, max: 150 },
      nights: 2,
    },
    {
      city: "Kyoto",
      neighborhood: "Ohara",
      rationale: "Rural and crowd-free.",
      price_range_usd_per_night: { min: 90, max: 170 },
      nights: 2,
    },
  ],
  legs: [
    {
      from: "Tokyo",
      to: "Kyoto",
      mode: "Shinkansen (Nozomi)",
      duration_minutes: 135,
      est_cost_usd: 95,
      leg_type: "inter-city",
      booking_required: false,
      notes: "~2h15m.",
    },
    {
      from: "Yanaka",
      to: "Tsukiji",
      mode: "Metro",
      duration_minutes: 30,
      est_cost_usd: 2,
      leg_type: "intra-city",
    },
  ],
  day_sequence: [
    { day: 1, city: "Tokyo" },
    { day: 2, city: "Tokyo" },
    { day: 3, city: "Tokyo", note: "Shinkansen to Kyoto in the afternoon" },
    { day: 4, city: "Kyoto" },
    { day: 5, city: "Kyoto" },
  ],
  summary: "2 nights Tokyo, 2 nights Kyoto, Shinkansen between.",
};

describe("LogisticsAgent — feasible Japan plan", () => {
  it("returns stays for both cities", async () => {
    const client = createMockGeminiClient([FEASIBLE_PLAN]);
    const agent = new LogisticsAgent(client);

    const { data } = await agent.run(japanConstraints());

    const cities = new Set(data.stays.map((s) => s.city));
    expect(cities.has("Tokyo")).toBe(true);
    expect(cities.has("Kyoto")).toBe(true);
  });

  it("includes the inter-city Shinkansen leg (~135 min)", async () => {
    const client = createMockGeminiClient([FEASIBLE_PLAN]);
    const agent = new LogisticsAgent(client);

    const { data } = await agent.run(japanConstraints());

    const shinkansen = data.legs.find(
      (l) => l.leg_type === "inter-city" && /shinkansen/i.test(l.mode)
    );
    expect(shinkansen).toBeDefined();
    expect(shinkansen?.duration_minutes).toBe(135);
  });

  it("produces a non-backtracking day sequence with high confidence", async () => {
    const client = createMockGeminiClient([FEASIBLE_PLAN]);
    const agent = createLogisticsAgent(client);

    const { data, confidence } = await agent.run(japanConstraints());

    expect(isNonBacktrackingSequence(data.day_sequence)).toBe(true);
    expect(confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("wraps downstream failures in an AgentError", async () => {
    const client = createMockGeminiClient([new Error("model exploded")]);
    const agent = new LogisticsAgent(client);
    await expect(agent.run(japanConstraints())).rejects.toBeInstanceOf(AgentError);
  });
});

describe("LogisticsAgent — infeasible plans lower confidence", () => {
  it("drops confidence when the sequence backtracks", async () => {
    const backtracking: LogisticsPlan = {
      ...FEASIBLE_PLAN,
      day_sequence: [
        { day: 1, city: "Tokyo" },
        { day: 2, city: "Kyoto" },
        { day: 3, city: "Tokyo" }, // back to Tokyo — backtrack
      ],
    };
    const client = createMockGeminiClient([backtracking]);
    const agent = new LogisticsAgent(client);

    const { confidence } = await agent.run(japanConstraints());
    expect(confidence).toBeLessThanOrEqual(0.5);
  });
});

describe("isNonBacktrackingSequence", () => {
  it("accepts contiguous city blocks (including a transfer day)", () => {
    expect(
      isNonBacktrackingSequence([
        { day: 1, city: "Tokyo" },
        { day: 2, city: "Tokyo" },
        { day: 3, city: "Kyoto" },
        { day: 4, city: "Kyoto" },
      ])
    ).toBe(true);
  });

  it("accepts a single-city trip", () => {
    expect(
      isNonBacktrackingSequence([
        { day: 1, city: "Tokyo" },
        { day: 2, city: "Tokyo" },
      ])
    ).toBe(true);
  });

  it("rejects returning to a city after leaving it", () => {
    expect(
      isNonBacktrackingSequence([
        { day: 1, city: "Tokyo" },
        { day: 2, city: "Kyoto" },
        { day: 3, city: "Tokyo" },
      ])
    ).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(
      isNonBacktrackingSequence([
        { day: 1, city: "Tokyo" },
        { day: 2, city: "tokyo" },
        { day: 3, city: "Kyoto" },
      ])
    ).toBe(true);
  });
});

describe("isNonBacktrackingSequence — day trips (stays-aware)", () => {
  const stay = (city: string, nights: number) => ({
    city,
    neighborhood: `${city} central`,
    rationale: "base",
    price_range_usd_per_night: { min: 80, max: 150 },
    nights,
  });

  it("accepts a day trip to a city with no overnight stay", () => {
    // Osaka base, day-trip to nearby Nara, back to Osaka — Nara has no stay.
    const seq = [
      { day: 1, city: "Osaka" },
      { day: 2, city: "Osaka" },
      { day: 3, city: "Nara" },
      { day: 4, city: "Osaka" },
    ];
    expect(isNonBacktrackingSequence(seq, [stay("Osaka", 3)])).toBe(true);
  });

  it("still flags returning to a city you slept in (overnight backtrack)", () => {
    const seq = [
      { day: 1, city: "Tokyo" },
      { day: 2, city: "Kyoto" },
      { day: 3, city: "Tokyo" },
    ];
    expect(isNonBacktrackingSequence(seq, [stay("Tokyo", 1), stay("Kyoto", 1)])).toBe(false);
  });

  it("falls back to the strict rule when stays are empty or omitted", () => {
    const seq = [
      { day: 1, city: "Tokyo" },
      { day: 2, city: "Kyoto" },
      { day: 3, city: "Tokyo" },
    ];
    expect(isNonBacktrackingSequence(seq, [])).toBe(false);
    expect(isNonBacktrackingSequence(seq)).toBe(false);
  });
});

describe("buildLogisticsPrompt", () => {
  it("embeds the Shinkansen grounding and backtracking rule", () => {
    const prompt = buildLogisticsPrompt(japanConstraints(), getDestinationData("Japan"));
    expect(prompt).toMatch(/Shinkansen/i);
    expect(prompt).toMatch(/backtrack/i);
    expect(prompt).toContain("Tokyo");
  });
});
