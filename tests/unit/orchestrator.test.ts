import { describe, it, expect } from "vitest";
import {
  OrchestratorAgent,
  createOrchestratorAgent,
  ExtractionSchema,
  type Extraction,
} from "@/lib/agents/orchestrator";
import { createMockGeminiClient } from "@/lib/gemini/mock";
import { buildExtractionPrompt } from "@/lib/prompts/orchestrator";
import type { TripConstraints } from "@/lib/types";

// A complete extraction matching the PRD Japan example.
const JAPAN_EXTRACTION: Extraction = {
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
};

const JAPAN_REQUEST =
  "Plan a 5-day trip to Japan. Tokyo + Kyoto. $3,000 budget. Love food and temples, hate crowds.";

describe("OrchestratorAgent.extractConstraints — complete request", () => {
  it("extracts all PRD constraints exactly for the Japan example", async () => {
    const client = createMockGeminiClient([JAPAN_EXTRACTION]);
    const orchestrator = new OrchestratorAgent(client);

    const result = await orchestrator.extractConstraints(JAPAN_REQUEST);

    expect(result.status).toBe("complete");
    // Narrow the union for type-safe assertion.
    if (result.status !== "complete") throw new Error("expected complete");

    const expected: TripConstraints = {
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
    };
    expect(result.constraints).toEqual(expected);
  });

  it("works via the factory function too", async () => {
    const client = createMockGeminiClient([JAPAN_EXTRACTION]);
    const orchestrator = createOrchestratorAgent(client);
    const result = await orchestrator.extractConstraints(JAPAN_REQUEST);
    expect(result.status).toBe("complete");
  });

  it("normalizes currency to USD when the model omits it", async () => {
    const client = createMockGeminiClient([{ ...JAPAN_EXTRACTION, currency: null }]);
    const orchestrator = new OrchestratorAgent(client);
    const result = await orchestrator.extractConstraints(JAPAN_REQUEST);
    if (result.status !== "complete") throw new Error("expected complete");
    expect(result.constraints.currency).toBe("USD");
  });
});

describe("OrchestratorAgent.extractConstraints — under-specified request", () => {
  it("returns clarifications instead of guessing hard constraints", async () => {
    const underspecified: Extraction = {
      destination: "Japan",
      duration_days: null,
      cities: null,
      budget_usd: null,
      currency: "USD",
      preferences: [],
      avoidances: [],
      travelers: null,
      pace: "moderate",
      clarifications_needed: [
        "How many days will your trip be?",
        "Which cities or regions of Japan would you like to visit?",
        "What is your total budget (and in which currency)?",
      ],
    };
    const client = createMockGeminiClient([underspecified]);
    const orchestrator = new OrchestratorAgent(client);

    const result = await orchestrator.extractConstraints("Plan a trip to Japan.");

    expect(result.status).toBe("needs_clarification");
    if (result.status !== "needs_clarification") throw new Error("expected clarification");

    expect(result.clarifications_needed.length).toBeGreaterThan(0);
    // It surfaced what it DID know (destination) without inventing the rest.
    expect(result.partial.destination).toBe("Japan");
    expect(result.partial.duration_days).toBeUndefined();
    expect(result.partial.budget_usd).toBeUndefined();
    expect(result.partial.cities).toBeUndefined();
  });

  it("adds a clarification deterministically even if the model forgets (backstop)", async () => {
    // Model leaves duration_days null but returns NO clarifications.
    const forgetful: Extraction = {
      ...JAPAN_EXTRACTION,
      duration_days: null,
      clarifications_needed: [],
    };
    const client = createMockGeminiClient([forgetful]);
    const orchestrator = new OrchestratorAgent(client);

    const result = await orchestrator.extractConstraints("Trip to Japan, Tokyo+Kyoto, $3000");

    expect(result.status).toBe("needs_clarification");
    if (result.status !== "needs_clarification") throw new Error("expected clarification");
    expect(
      result.clarifications_needed.some((q) => /how many days/i.test(q))
    ).toBe(true);
  });

  it("returns a clarification for empty input without calling Gemini", async () => {
    // Empty response list → if the client were called, it would throw "exhausted".
    const client = createMockGeminiClient([]);
    const orchestrator = new OrchestratorAgent(client);

    const result = await orchestrator.extractConstraints("   ");

    expect(result.status).toBe("needs_clarification");
    if (result.status !== "needs_clarification") throw new Error("expected clarification");
    expect(result.clarifications_needed).toHaveLength(1);
  });
});

describe("OrchestratorAgent.extractConstraints — conflicting constraints", () => {
  it("surfaces a clarifying question describing the conflict", async () => {
    const conflicting: Extraction = {
      destination: "Japan",
      duration_days: 5,
      cities: ["Tokyo"],
      budget_usd: 500,
      currency: "USD",
      preferences: ["luxury ryokan", "five-star hotels"],
      avoidances: [],
      travelers: 1,
      pace: "moderate",
      clarifications_needed: [
        "A $500 budget is very low for 5 days in Japan with luxury stays. Would you like to increase the budget or relax the luxury preference?",
      ],
    };
    const client = createMockGeminiClient([conflicting]);
    const orchestrator = new OrchestratorAgent(client);

    const result = await orchestrator.extractConstraints(
      "5 days in Tokyo, luxury 5-star ryokans every night, total budget $500."
    );

    expect(result.status).toBe("needs_clarification");
    if (result.status !== "needs_clarification") throw new Error("expected clarification");
    // All hard fields were present, so the only question is the conflict itself.
    expect(result.clarifications_needed).toHaveLength(1);
    expect(result.clarifications_needed[0]).toMatch(/budget/i);
    // Partial still reflects what was parsed.
    expect(result.partial.budget_usd).toBe(500);
    expect(result.partial.cities).toEqual(["Tokyo"]);
  });
});

describe("OrchestratorAgent.synthesize — stub", () => {
  it("throws a not-implemented error until Sprint 5", async () => {
    const client = createMockGeminiClient([]);
    const orchestrator = new OrchestratorAgent(client);
    await expect(
      orchestrator.synthesize({
        destination: "Japan",
        duration_days: 5,
        cities: ["Tokyo", "Kyoto"],
        budget_usd: 3000,
        currency: "USD",
        preferences: ["food"],
        avoidances: ["crowds"],
        travelers: 1,
        pace: "moderate",
        clarifications_needed: [],
      })
    ).rejects.toThrow(/Sprint 5/);
  });
});

describe("buildExtractionPrompt", () => {
  it("includes the user request and the Japan few-shot anchor", () => {
    const prompt = buildExtractionPrompt("Weekend in Lisbon on a budget");
    expect(prompt).toContain("Weekend in Lisbon on a budget");
    expect(prompt).toContain("Tokyo");
    expect(prompt).toContain("clarifications_needed");
    expect(prompt).toMatch(/JSON only/i);
  });
});

describe("ExtractionSchema", () => {
  it("accepts nullable hard fields", () => {
    const parsed = ExtractionSchema.parse({
      destination: null,
      duration_days: null,
      cities: null,
      budget_usd: null,
      currency: null,
      preferences: [],
      avoidances: [],
      travelers: null,
      pace: null,
      clarifications_needed: ["Where would you like to go?"],
    });
    expect(parsed.destination).toBeNull();
  });

  it("rejects a non-positive duration", () => {
    expect(() =>
      ExtractionSchema.parse({
        destination: "Japan",
        duration_days: 0,
        cities: null,
        budget_usd: null,
        currency: null,
        preferences: [],
        avoidances: [],
        travelers: null,
        pace: null,
        clarifications_needed: [],
      })
    ).toThrow();
  });
});
