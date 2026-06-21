// Presentation helpers shared by the itinerary + stay/logistics screens.
//
// When the Logistics agent degrades (rate-limited / unavailable), the pipeline
// substitutes `fallbackLogistics`, which sets stay prices to a $0–$0 range and
// leg costs to $0 (see src/lib/agents/pipeline.ts). Rendering those raw reads as
// "free" or broken; these helpers surface them honestly as unavailable instead.

/** Per-night rate, or "Rate unavailable" when the figure is missing ($0–$0). */
export function formatNightlyRate(minUsd: number, maxUsd: number): string {
  if (minUsd <= 0 && maxUsd <= 0) return "Rate unavailable";
  if (minUsd === maxUsd) return `$${minUsd}/night`;
  return `$${minUsd}–$${maxUsd}/night`;
}

/** A dollar figure, or an em dash when it's missing/zero (degraded data). */
export function formatCostOrDash(usd: number): string {
  return usd > 0 ? `$${usd}` : "—";
}

/** True when a stay's nightly rate is the degraded $0–$0 placeholder. */
export function isRateUnavailable(minUsd: number, maxUsd: number): boolean {
  return minUsd <= 0 && maxUsd <= 0;
}
