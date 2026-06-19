import { describe, it, expect, vi, afterEach } from "vitest";
import { estimateCostUsd, logLLMUsage, logRequestLatency } from "@/lib/logging";

describe("estimateCostUsd", () => {
  it("returns 0 when usage is missing", () => {
    expect(estimateCostUsd(undefined)).toBe(0);
  });

  it("prices input and output tokens at the Flash Lite rates", () => {
    // 1M input @ $0.10 + 1M output @ $0.40 = $0.50
    const cost = estimateCostUsd({ promptTokens: 1_000_000, candidateTokens: 1_000_000 });
    expect(cost).toBeCloseTo(0.5, 6);
  });

  it("handles partial token counts", () => {
    const cost = estimateCostUsd({ promptTokens: 500_000 });
    expect(cost).toBeCloseTo(0.05, 6);
  });
});

describe("loggers", () => {
  afterEach(() => vi.restoreAllMocks());

  it("logLLMUsage writes a single gemini log line", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    logLLMUsage({
      model: "gemini-2.5-flash-lite",
      attempt: 0,
      durationMs: 123,
      success: true,
      usage: { promptTokens: 100, candidateTokens: 50, totalTokens: 150 },
    });
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain("[gemini]");
  });

  it("logRequestLatency writes a single api log line", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    logRequestLatency("/api/plan", 4200, true);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain("[api] route=/api/plan");
  });
});
