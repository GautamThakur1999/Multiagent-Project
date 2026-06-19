import type { GeminiClient } from "@/lib/gemini/client";
import type { TripConstraints, TripState } from "@/lib/types";
import { runPipeline, type ProgressEvent } from "@/lib/agents/pipeline";
import type { DestinationCache } from "@/lib/agents/destinationCache";
import { PlanRequestSchema, type ApiError } from "./schemas";

/** SSE events emitted by the plan stream. */
export type PlanEvent =
  | { event: "progress"; data: ProgressEvent }
  | { event: "itinerary"; data: TripState }
  | { event: "error"; data: ApiError };

export type PlanEmit = (event: PlanEvent) => void;

export type ValidatePlanResult =
  | { ok: true; constraints: TripConstraints }
  | { ok: false; status: number; error: ApiError };

/** Validates the plan body up front so the route can return a 400 before opening a stream. */
export function validatePlanBody(body: unknown): ValidatePlanResult {
  const parsed = PlanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: {
        error: "invalid_request",
        message: "Request body must be { constraints: TripConstraints }.",
        details: parsed.error.flatten(),
      },
    };
  }
  return { ok: true, constraints: parsed.data.constraints };
}

export interface StreamPlanOptions {
  maxReplans?: number;
  cache?: DestinationCache;
}

/**
 * Drives the planning pipeline, emitting ordered SSE events: a sequence of
 * `progress` events (one per agent start/done) followed by a terminal `itinerary`
 * event, or a single `error` event on failure. HTTP-independent so the route
 * handler and tests share the same code path.
 */
export async function streamPlan(
  constraints: TripConstraints,
  client: GeminiClient,
  emit: PlanEmit,
  options: StreamPlanOptions = {}
): Promise<void> {
  try {
    const state = await runPipeline(constraints, client, {
      maxReplans: options.maxReplans,
      destinationCache: options.cache,
      onProgress: (e) => emit({ event: "progress", data: e }),
    });
    emit({ event: "itinerary", data: state });
  } catch (err) {
    emit({
      event: "error",
      data: {
        error: "planning_error",
        message: "We hit a problem building your plan. Please try again.",
        details: err instanceof Error ? err.message : String(err),
      },
    });
  }
}

/** Serializes a PlanEvent as an SSE frame. */
export function formatSSE(event: PlanEvent): string {
  return `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
}
