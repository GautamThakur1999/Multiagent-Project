import type { GeminiClient } from "@/lib/gemini/client";
import { OrchestratorAgent, type ExtractionResult } from "@/lib/agents/orchestrator";
import { ParseRequestSchema, type ApiError } from "./schemas";
import { checkRequestGuardrails } from "./guardrails";

export interface HandlerResponse {
  status: number;
  body: ExtractionResult | ApiError;
}

/**
 * Core logic for `POST /api/parse`. HTTP-independent and dependency-injected so it
 * can be unit-tested with a mocked Gemini client. Returns the `ExtractionResult`
 * union ({status:"complete"|"needs_clarification"}) on success, or a structured error.
 */
export async function handleParse(
  body: unknown,
  client: GeminiClient
): Promise<HandlerResponse> {
  const parsed = ParseRequestSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      body: {
        error: "invalid_request",
        message: "Request body must be { request: string }.",
        details: parsed.error.flatten(),
      },
    };
  }

  const guard = checkRequestGuardrails(parsed.data.request);
  if (!guard.ok) {
    return {
      status: guard.status ?? 400,
      body: { error: guard.error ?? "bad_request", message: guard.message ?? "Invalid request." },
    };
  }

  try {
    const orchestrator = new OrchestratorAgent(client);
    const result = await orchestrator.extractConstraints(parsed.data.request);
    return { status: 200, body: result };
  } catch (err) {
    return {
      status: 502,
      body: {
        error: "upstream_error",
        message: "We couldn't understand the request right now. Please try again.",
        details: err instanceof Error ? err.message : String(err),
      },
    };
  }
}
