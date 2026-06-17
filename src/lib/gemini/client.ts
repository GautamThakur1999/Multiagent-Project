import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

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
export type RawGenerateFn = (
  prompt: string
) => Promise<{ text: string; usage?: UsageMetadata }>;

function buildRealRawFn(apiKey: string, model: string): RawGenerateFn {
  const ai = new GoogleGenAI({ apiKey });
  return async (prompt: string) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" },
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

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Gemini request timed out after ${ms}ms`)),
        ms
      )
    ),
  ]);
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

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const start = Date.now();

        let raw: { text: string; usage?: UsageMetadata };
        try {
          raw = await withTimeout(generate(prompt), timeoutMs);
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
