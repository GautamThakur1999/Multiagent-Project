// Client-side fetch helpers for the planning API. Type-only imports keep this
// free of any server runtime code.
import type { ExtractionResult } from "@/lib/agents/orchestrator";
import type { ApiError } from "@/lib/api/schemas";

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
