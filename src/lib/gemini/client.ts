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
  errorType?: "json_parse" | "zod_validation" | "timeout" | "api_error";
}

export type LogHook = (event: LogEvent) => void;

export interface GeminiClientOptions {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
  maxRetries?: number;
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
  const generate = rawFn ?? buildRealRawFn(options.apiKey, model);

  return {
    async generateStructured<T>(
      prompt: string,
      schema: z.ZodType<T>
    ): Promise<T> {
      let lastError: Error = new Error("Unknown error");
      const responseSchema = toResponseJsonSchema(schema);

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const start = Date.now();

        let raw: { text: string; usage?: UsageMetadata };
        try {
          raw = await withTimeout((signal) => generate(prompt, signal, responseSchema), timeoutMs);
        } catch (err) {
          const e = err instanceof Error ? err : new Error(String(err));
          const isTimeout = e.message.includes("timed out");
          options.onLog?.({
            model,
            attempt,
            durationMs: Date.now() - start,
            success: false,
            errorType: isTimeout ? "timeout" : "api_error",
          });
          throw e; // API and timeout errors are not retried
        }

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
