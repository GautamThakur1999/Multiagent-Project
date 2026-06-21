import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { toResponseJsonSchema } from "./schema";

export interface UsageMetadata {
  promptTokens?: number;
  candidateTokens?: number;
  totalTokens?: number;
}

export interface LogEvent {
  model: string;
  attempt: number;
  durationMs: number;
  success: boolean;
  usage?: UsageMetadata;
  errorType?: "json_parse" | "zod_validation" | "timeout" | "rate_limit" | "api_error";
}

export type LogHook = (event: LogEvent) => void;

export interface GeminiClientOptions {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
  maxRetries?: number;
  /** Retries on a 429 / quota error, with backoff, before giving up (default 2). */
  maxRateLimitRetries?: number;
  /** Base backoff between rate-limit retries, ms; doubles each retry (default 500). */
  rateLimitBaseMs?: number;
  /** Cap on any single rate-limit backoff, ms — bounds how long a user waits (default 4000). */
  rateLimitMaxMs?: number;
  onLog?: LogHook;
}

export interface GeminiClient {
  generateStructured<T>(prompt: string, schema: z.ZodType<T>): Promise<T>;
}

// Injectable raw generator — used by the real impl and overridable in tests.
// Receives an AbortSignal so a timed-out request can be cancelled in flight, and
// an optional JSON schema to enable Gemini structured output.
export type RawGenerateFn = (
  prompt: string,
  signal?: AbortSignal,
  responseSchema?: unknown
) => Promise<{ text: string; usage?: UsageMetadata }>;

function buildRealRawFn(apiKey: string, model: string): RawGenerateFn {
  const ai = new GoogleGenAI({ apiKey });
  return async (prompt: string, signal?: AbortSignal, responseSchema?: unknown) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // Structured output: constrain the model to the exact schema (Sprint 10).
        ...(responseSchema ? { responseJsonSchema: responseSchema } : {}),
        abortSignal: signal,
      },
    });
    return {
      text: response.text ?? "",
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount,
        candidateTokens: response.usageMetadata?.candidatesTokenCount,
        totalTokens: response.usageMetadata?.totalTokenCount,
      },
    };
  };
}

/**
 * Races `run(signal)` against a timeout. On timeout the AbortSignal fires so the
 * underlying request is cancelled, and the timer is always cleared in `finally`
 * so it never leaks past the call (a dangling timer keeps the event loop alive).
 */
function withTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  ms: number
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`Gemini request timed out after ${ms}ms`));
    }, ms);
  });
  return Promise.race([run(controller.signal), timeout]).finally(() =>
    clearTimeout(timer)
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A 429 / quota-exhausted error from the Gemini API — transient, worth a retry. */
function isRateLimitError(message: string): boolean {
  return message.includes("429") || message.includes("RESOURCE_EXHAUSTED");
}

/** The API's suggested backoff, if present ("retry in 24.3s" or "retryDelay": "24s"). */
function parseRetryDelayMs(message: string): number | undefined {
  const m =
    message.match(/retry in ([\d.]+)s/i) ?? message.match(/retryDelay["':\s]+"?([\d.]+)s/i);
  return m ? Math.ceil(parseFloat(m[1]) * 1000) : undefined;
}

/**
 * Creates a Gemini 2.5 Flash Lite client that returns Zod-validated typed JSON.
 * Retries on malformed JSON or Zod validation failures (not on API/timeout errors).
 * Pass `rawFn` to override the actual API call for testing.
 */
export function createGeminiClient(
  options: GeminiClientOptions,
  rawFn?: RawGenerateFn
): GeminiClient {
  const model = options.model ?? "gemini-2.5-flash-lite";
  const maxRetries = options.maxRetries ?? 2;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const maxRateLimitRetries = options.maxRateLimitRetries ?? 2;
  const rateLimitBaseMs = options.rateLimitBaseMs ?? 500;
  const rateLimitMaxMs = options.rateLimitMaxMs ?? 4_000;
  const generate = rawFn ?? buildRealRawFn(options.apiKey, model);

  return {
    async generateStructured<T>(
      prompt: string,
      schema: z.ZodType<T>
    ): Promise<T> {
      let lastError: Error = new Error("Unknown error");
      const responseSchema = toResponseJsonSchema(schema);

      // One network call, transparently retrying on 429/quota errors with bounded
      // backoff so a transient rate-limit spike doesn't instantly degrade the agent.
      // Timeouts and other API errors are still surfaced immediately (not retried).
      const callRawWithBackoff = async (
        attempt: number
      ): Promise<{ text: string; usage?: UsageMetadata }> => {
        for (let rl = 0; ; rl++) {
          const callStart = Date.now();
          try {
            return await withTimeout(
              (signal) => generate(prompt, signal, responseSchema),
              timeoutMs
            );
          } catch (err) {
            const e = err instanceof Error ? err : new Error(String(err));
            const isTimeout = e.message.includes("timed out");
            const rateLimited = !isTimeout && isRateLimitError(e.message);
            options.onLog?.({
              model,
              attempt,
              durationMs: Date.now() - callStart,
              success: false,
              errorType: isTimeout ? "timeout" : rateLimited ? "rate_limit" : "api_error",
            });
            if (rateLimited && rl < maxRateLimitRetries) {
              const backoff = Math.min(
                parseRetryDelayMs(e.message) ?? rateLimitBaseMs * 2 ** rl,
                rateLimitMaxMs
              );
              await sleep(backoff);
              continue; // retry the network call without consuming a schema attempt
            }
            throw e;
          }
        }
      };

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const start = Date.now();
        const raw = await callRawWithBackoff(attempt);

        // Retry on JSON parse failures
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw.text);
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          options.onLog?.({
            model,
            attempt,
            durationMs: Date.now() - start,
            success: false,
            usage: raw.usage,
            errorType: "json_parse",
          });
          continue;
        }

        // Retry on Zod validation failures
        try {
          const validated = schema.parse(parsed);
          options.onLog?.({
            model,
            attempt,
            durationMs: Date.now() - start,
            success: true,
            usage: raw.usage,
          });
          return validated;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          options.onLog?.({
            model,
            attempt,
            durationMs: Date.now() - start,
            success: false,
            usage: raw.usage,
            errorType: "zod_validation",
          });
          continue;
        }
      }

      throw new Error(
        `Gemini structured generation failed after ${maxRetries} retr${maxRetries === 1 ? "y" : "ies"}: ${lastError.message}`
      );
    },
  };
}
