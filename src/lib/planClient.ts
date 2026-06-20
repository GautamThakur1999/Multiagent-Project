// Client-side fetch helpers for the planning API. Type-only imports keep this
// free of any server runtime code.
import type { ExtractionResult } from "@/lib/agents/orchestrator";
import type { ProgressEvent } from "@/lib/agents/pipeline";
import type { ApiError } from "@/lib/api/schemas";
import type { ItineraryDay, TripConstraints, TripState } from "@/lib/types";

export type ParseOutcome =
  | { ok: true; result: ExtractionResult }
  | { ok: false; error: ApiError };

/** POSTs a raw request to /api/parse and returns the typed outcome. */
export async function parseRequest(
  request: string,
  signal?: AbortSignal
): Promise<ParseOutcome> {
  let res: Response;
  try {
    res = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request }),
      signal,
    });
  } catch (err) {
    return {
      ok: false,
      error: {
        error: "network_error",
        message: "We couldn't reach the planner. Check your connection and try again.",
        details: err instanceof Error ? err.message : String(err),
      },
    };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = { error: "bad_response", message: "The planner returned an unexpected response." };
  }

  if (!res.ok) return { ok: false, error: body as ApiError };
  return { ok: true, result: body as ExtractionResult };
}

// --- /api/plan SSE streaming ------------------------------------------------

export interface PlanStreamHandlers {
  onProgress: (event: ProgressEvent) => void;
  onItinerary: (state: TripState) => void;
  onError: (error: ApiError) => void;
}

/** Parses a single SSE frame ("event: x\ndata: {...}") into its type + payload. */
function parseFrame(frame: string): { event: string; data: string } | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join("\n") };
}

function dispatch(event: string, data: string, handlers: PlanStreamHandlers): void {
  let payload: unknown;
  try {
    payload = JSON.parse(data);
  } catch {
    return; // ignore unparseable frames
  }
  if (event === "progress") handlers.onProgress(payload as ProgressEvent);
  else if (event === "itinerary") handlers.onItinerary(payload as TripState);
  else if (event === "error") handlers.onError(payload as ApiError);
}

/**
 * POSTs confirmed constraints to /api/plan and consumes the SSE stream, invoking
 * the handlers as ordered `progress` events arrive and finally the `itinerary`
 * (or `error`) event. EventSource can't POST, so this reads the fetch body stream.
 */
export async function streamPlanRequest(
  constraints: TripConstraints,
  handlers: PlanStreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ constraints }),
      signal,
    });
  } catch (err) {
    handlers.onError({
      error: "network_error",
      message: "We couldn't reach the planner. Check your connection and try again.",
      details: err instanceof Error ? err.message : String(err),
    });
    return;
  }

  if (!res.ok || !res.body) {
    let body: unknown = { error: "planning_error", message: "We hit a problem building your plan." };
    try {
      body = await res.json();
    } catch {
      /* keep default */
    }
    handlers.onError(body as ApiError);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const parsed = parseFrame(frame);
      if (parsed) dispatch(parsed.event, parsed.data, handlers);
    }
  }
  const tail = parseFrame(buffer.trim());
  if (tail) dispatch(tail.event, tail.data, handlers);
}

// --- /api/regenerate-day and /api/cheaper (non-streaming JSON) ---------------

async function postJson<T>(url: string, payload: unknown): Promise<
  { ok: true; data: T } | { ok: false; error: ApiError }
> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return {
      ok: false,
      error: {
        error: "network_error",
        message: "We couldn't reach the planner. Check your connection and try again.",
        details: err instanceof Error ? err.message : String(err),
      },
    };
  }
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = { error: "bad_response", message: "The planner returned an unexpected response." };
  }
  if (!res.ok) return { ok: false, error: body as ApiError };
  return { ok: true, data: body as T };
}

/** Regenerates a single day; returns the fresh day on success. */
export function regenerateDayRequest(constraints: TripConstraints, day: number) {
  return postJson<{ day: ItineraryDay }>("/api/regenerate-day", { constraints, day });
}

/** Re-plans cheaper; returns a full updated TripState on success. */
export function makeCheaperRequest(constraints: TripConstraints) {
  return postJson<{ state: TripState }>("/api/cheaper", { constraints });
}
