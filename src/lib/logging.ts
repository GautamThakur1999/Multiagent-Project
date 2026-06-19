import type { LogEvent, UsageMetadata } from "@/lib/gemini/client";

// Gemini 2.5 Flash Lite approximate pricing (USD per 1M tokens). Used only for
// cost telemetry — not billing. Update if pricing changes.
const PRICE_PER_1M_INPUT = 0.1;
const PRICE_PER_1M_OUTPUT = 0.4;

export function estimateCostUsd(usage: UsageMetadata | undefined): number {
  if (!usage) return 0;
  const input = ((usage.promptTokens ?? 0) / 1_000_000) * PRICE_PER_1M_INPUT;
  const output = ((usage.candidateTokens ?? 0) / 1_000_000) * PRICE_PER_1M_OUTPUT;
  return input + output;
}

/** LLM usage logger wired into the Gemini client's `onLog` hook (Sprint 2). */
export function logLLMUsage(event: LogEvent): void {
  const cost = estimateCostUsd(event.usage);
  const parts = [
    `model=${event.model}`,
    `attempt=${event.attempt}`,
    `ok=${event.success}`,
    `ms=${event.durationMs}`,
    `tokens=${event.usage?.totalTokens ?? "?"}`,
    `~$${cost.toFixed(6)}`,
  ];
  if (event.errorType) parts.push(`err=${event.errorType}`);
  // eslint-disable-next-line no-console
  console.info(`[gemini] ${parts.join(" ")}`);
}

/** Logs end-to-end latency for an API request. */
export function logRequestLatency(route: string, ms: number, ok: boolean): void {
  // eslint-disable-next-line no-console
  console.info(`[api] route=${route} ms=${ms} ok=${ok}`);
}
