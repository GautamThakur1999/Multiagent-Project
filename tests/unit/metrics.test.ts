import { describe, it, expect, vi, afterEach } from "vitest";
import { createPlanMetrics, logPlanSummary, spotAuditPlan } from "@/lib/metrics";
import type { LogEvent } from "@/lib/gemini/client";
import type { TripState } from "@/lib/types";

afterEach(() => vi.restoreAllMocks());

function ev(success: boolean, total: number): LogEvent {
  return { model: "gemini-2.5-flash-lite", attempt: 0, durationMs: 100, success, usage: { promptTokens: total / 2, candidateTokens: total / 2, totalTokens: total } };
}

const STATE = (cost: number): TripState => ({
  constraints: { destination: "Japan", duration_days: 2, cities: ["Tokyo"], budget_usd: 3000, currency: "USD", preferences: [], avoidances: [], travelers: 1, pace: "moderate", clarifications_needed: [] },
  final_itinerary: [{ day: 1, city: "Tokyo", items: [{ title: "X", description: "y", category: "food", priority: "must-do", est_cost_usd: cost, time_block: "morning" }] }],
  has_caveats: false, caveats: [], replan_count: 0,
});

describe("createPlanMetrics", () => {
  it("accumulates successful calls and ignores failures", () => {
    const m = createPlanMetrics();
    m.onLog(ev(true, 1000));
    m.onLog(ev(false, 9999)); // ignored
    m.onLog(ev(true, 2000));
    const s = m.snapshot();
    expect(s.calls).toBe(2);
    expect(s.tokens).toBe(3000);
    expect(s.costUsd).toBeGreaterThan(0);
  });

  it("logPlanSummary emits a [plan] line", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    const m = createPlanMetrics();
    m.onLog(ev(true, 1000));
    logPlanSummary("/api/plan", m, 5000, 1);
    expect(spy.mock.calls[0][0]).toContain("[plan] route=/api/plan");
  });
});

describe("spotAuditPlan", () => {
  it("does nothing when not sampled", () => {
    expect(spotAuditPlan(STATE(99999), 0.05, () => 0.9)).toEqual([]);
  });

  it("flags an implausible item cost when sampled", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const flags = spotAuditPlan(STATE(99999), 0.05, () => 0);
    expect(flags.length).toBeGreaterThan(0);
    expect(flags[0]).toMatch(/implausible cost/);
  });

  it("passes a normal plan even when sampled", () => {
    expect(spotAuditPlan(STATE(25), 1, () => 0)).toEqual([]);
  });
});
