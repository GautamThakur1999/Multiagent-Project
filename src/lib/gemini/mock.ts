import { z } from "zod";
import type { GeminiClient } from "./client";

/**
 * Creates a mock GeminiClient for tests.
 * Each call to `generateStructured` consumes the next response in `responses`.
 * Pass typed objects (parsed + validated by schema) or Error instances to simulate failures.
 */
export function createMockGeminiClient(responses: Array<unknown>): GeminiClient {
  let index = 0;
  return {
    async generateStructured<T>(_prompt: string, schema: z.ZodType<T>): Promise<T> {
      if (index >= responses.length) {
        throw new Error(
          `MockGeminiClient exhausted: no response configured for call #${index + 1}`
        );
      }
      const response = responses[index++];
      if (response instanceof Error) throw response;
      return schema.parse(response);
    },
  };
}
