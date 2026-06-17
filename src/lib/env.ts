// Server-side only. Never import from client components.
import { z } from "zod";

const EnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY must be a non-empty string"),
});

type Env = z.infer<typeof EnvSchema>;

let _cached: Env | null = null;

export function getEnv(): Env {
  if (_cached) return _cached;

  const result = EnvSchema.safeParse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  });

  if (!result.success) {
    const lines = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Missing or invalid environment variables:\n${lines}`);
  }

  _cached = result.data;
  return _cached;
}

/** Reset the cached env — test use only. */
export function _resetEnvCache(): void {
  _cached = null;
}
