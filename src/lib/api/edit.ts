import type { GeminiClient } from "@/lib/gemini/client";
import type { ItineraryDay, TripConstraints, TripState } from "@/lib/types";
import { runPipeline, type PipelineOptions } from "@/lib/agents/pipeline";
import {
  CheaperRequestSchema,
  RegenerateDayRequestSchema,
  type ApiError,
} from "./schemas";

const CHEAPER_FACTOR = 0.8;

/**
 * Re-plans with a tightened budget target so the agents favour cheaper stays and
 * activities, then restores the original budget on the returned state (for display).
 * Runs WITHOUT the destination cache so it produces a fresh, cheaper plan.
 */
export async function makeCheaper(
  constraints: TripConstraints,
  client: GeminiClient,
  options: PipelineOptions = {}
): Promise<TripState> {
  const reduced: TripConstraints = {
    ...constraints,
    budget_usd: Math.max(1, Math.round(constraints.budget_usd * CHEAPER_FACTOR)),
  };
  const state = await runPipeline(reduced, client, options);
  return { ...state, constraints };
}

/** Re-plans fresh and returns just the requested day (null if out of range). */
export async function regenerateDay(
  constraints: TripConstraints,
  day: number,
  client: GeminiClient,
  options: PipelineOptions = {}
): Promise<ItineraryDay | null> {
  const state = await runPipeline(constraints, client, options);
  return state.final_itinerary?.find((d) => d.day === day) ?? null;
}

export interface EditResponse {
  status: number;
  body: { day: ItineraryDay } | { state: TripState } | ApiError;
}

/** Core logic for `POST /api/regenerate-day` (HTTP-independent, client-injected). */
export async function handleRegenerateDay(
  body: unknown,
  client: GeminiClient
): Promise<EditResponse> {
  const parsed = RegenerateDayRequestSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      body: {
        error: "invalid_request",
        message: "Request body must be { constraints, day }.",
        details: parsed.error.flatten(),
      },
    };
  }
  try {
    const day = await regenerateDay(parsed.data.constraints, parsed.data.day, client);
    if (!day) {
      return { status: 422, body: { error: "no_such_day", message: "That day isn't in this trip." } };
    }
    return { status: 200, body: { day } };
  } catch (err) {
    return {
      status: 502,
      body: {
        error: "upstream_error",
        message: "We couldn't regenerate that day right now. Please try again.",
        details: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

/** Core logic for `POST /api/cheaper` (HTTP-independent, client-injected). */
export async function handleCheaper(body: unknown, client: GeminiClient): Promise<EditResponse> {
  const parsed = CheaperRequestSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      body: {
        error: "invalid_request",
        message: "Request body must be { constraints }.",
        details: parsed.error.flatten(),
      },
    };
  }
  try {
    const state = await makeCheaper(parsed.data.constraints, client);
    return { status: 200, body: { state } };
  } catch (err) {
    return {
      status: 502,
      body: {
        error: "upstream_error",
        message: "We couldn't find a cheaper plan right now. Please try again.",
        details: err instanceof Error ? err.message : String(err),
      },
    };
  }
}
