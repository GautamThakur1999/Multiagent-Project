export const MIN_REQUEST_CHARS = 3;
export const MAX_REQUEST_CHARS = 2000;

// Prompt-injection / off-topic abuse patterns. Conservative on purpose — genuine
// "I don't have enough info" cases are handled gracefully by the orchestrator's
// clarification flow, not rejected here.
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(the\s+)?(previous|prior|above)\s+(instructions|prompts?)/i,
  /disregard\s+(all\s+)?(the\s+)?(previous|prior|above)/i,
  /\bsystem\s+prompt\b/i,
  /you\s+are\s+now\s+(a|an|the)\b/i,
  /\bdeveloper\s+mode\b/i,
  /reveal\s+(your\s+)?(system\s+)?(prompt|instructions)/i,
];

export interface GuardrailResult {
  ok: boolean;
  status?: number;
  error?: string;
  message?: string;
}

const OK: GuardrailResult = { ok: true };

/**
 * Validates a raw request string before it reaches the LLM: length bounds and
 * prompt-injection rejection. Returns a clean structured error (never throws).
 */
export function checkRequestGuardrails(request: string): GuardrailResult {
  const trimmed = request.trim();

  if (trimmed.length < MIN_REQUEST_CHARS) {
    return {
      ok: false,
      status: 400,
      error: "empty_request",
      message: "Please describe the trip you'd like to plan.",
    };
  }

  if (trimmed.length > MAX_REQUEST_CHARS) {
    return {
      ok: false,
      status: 400,
      error: "request_too_long",
      message: `Please keep your request under ${MAX_REQUEST_CHARS} characters.`,
    };
  }

  if (INJECTION_PATTERNS.some((p) => p.test(trimmed))) {
    return {
      ok: false,
      status: 422,
      error: "unsupported_request",
      message:
        "This doesn't look like a travel request we can process. Tell us your destination, dates, budget, and what you enjoy.",
    };
  }

  return OK;
}
