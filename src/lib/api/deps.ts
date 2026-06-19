// Server-only module: imported exclusively by route handlers under app/api.
import { createGeminiClient, type GeminiClient } from "@/lib/gemini/client";
import { getEnv } from "@/lib/env";
import { logLLMUsage } from "@/lib/logging";
import {
  createInMemoryDestinationCache,
  type DestinationCache,
} from "@/lib/agents/destinationCache";

/** Builds the real Gemini client from server env. Throws if GEMINI_API_KEY is missing. */
export function buildGeminiClient(): GeminiClient {
  return createGeminiClient({
    apiKey: getEnv().GEMINI_API_KEY,
    onLog: logLLMUsage,
  });
}

// Process-wide destination-research cache shared across requests.
let _cache: DestinationCache | null = null;
export function getDestinationCache(): DestinationCache {
  if (!_cache) _cache = createInMemoryDestinationCache();
  return _cache;
}
