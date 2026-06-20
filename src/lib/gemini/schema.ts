import { z } from "zod";

/**
 * Converts a Zod schema into a JSON Schema for Gemini's `responseJsonSchema`
 * structured-output mode. This forces the model to emit schema-conforming JSON
 * (correct enums, types, required fields) instead of plausible-but-invalid output
 * that fails strict Zod validation downstream.
 *
 * Returns `undefined` if conversion fails — callers then fall back to prompt-only
 * JSON mode (still validated by Zod, with retries).
 */
export function toResponseJsonSchema(schema: z.ZodType<unknown>): unknown | undefined {
  try {
    const json = z.toJSONSchema(schema, { unrepresentable: "any" }) as Record<string, unknown>;
    // Gemini doesn't want the JSON Schema dialect marker.
    delete json["$schema"];
    return json;
  } catch {
    return undefined;
  }
}
