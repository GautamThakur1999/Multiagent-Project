import type { LogEvent } from "@/lib/gemini/client";
import { estimateCostUsd } from "@/lib/logging";
import type { TripState } from "@/lib/types";

export interface PlanMetrics {
  /** Feed into the Gemini client's `onLog` to accumulate per-plan usage. */
  onLog: (event: LogEvent) => void;
  snapshot: () => { calls: number; tokens: number; costUsd: number };
}

/** Accumulates Gemini cost/latency across all agent calls in a single plan. */
export function createPlanMetrics(): PlanMetrics {
  let calls = 0;
  let tokens = 0;
  let costUsd = 0;
  return {
    onLog: (e) => {
      if (!e.success) return;
      calls += 1;
      tokens += e.usage?.totalTokens ?? 0;
      costUsd += estimateCostUsd(e.usage);
    },
    snapshot: () => ({ calls, tokens, costUsd }),
  };
}

/** Emits a single structured cost-per-plan + latency summary line. */
export function logPlanSummary(route: string, metrics: PlanMetrics, ms: number, replans: number): void {
  const s = metrics.snapshot();
  // eslint-disable-next-line no-console
  console.info(
    `[plan] route=${route} ms=${ms} agentCalls=${s.calls} tokens=${s.tokens} cost=~$${s.costUsd.toFixed(4)} replans=${replans}`
  );
}

/**
 * Hallucination spot-audit hook (PRD guardrail). Samples a fraction of delivered
 * plans and flags structurally implausible items (e.g. impossible costs) for
 * manual review. Returns the flags; logs them when sampled. Deterministic via the
 * injectable `rand` for testing.
 */
export function spotAuditPlan(state: TripState, sampleRate = 0.05, rand: () => number = Math.random): string[] {
  if (rand() > sampleRate) return [];
  const flags: string[] = [];
  for (const day of state.final_itinerary ?? []) {
    for (const item of day.items) {
      if (item.est_cost_usd < 0 || item.est_cost_usd > 5000) {
        flags.push(`Day ${day.day} "${item.title}": implausible cost $${item.est_cost_usd}`);
      }
    }
  }
  const budget = state.budget_breakdown;
  if (budget && budget.total_usd > state.constraints.budget_usd * 3) {
    flags.push(`Total $${budget.total_usd} far exceeds budget $${state.constraints.budget_usd}`);
  }
  if (flags.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(`[audit] plan flagged: ${flags.join("; ")}`);
  }
  return flags;
}
