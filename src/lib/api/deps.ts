// Server-only module: imported exclusively by route handlers under app/api.
import { createGeminiClient, type GeminiClient, type LogHook } from "@/lib/gemini/client";
import { getEnv } from "@/lib/env";
import { logLLMUsage } from "@/lib/logging";
import {
  createInMemoryDestinationCache,
  type DestinationCache,
} from "@/lib/agents/destinationCache";

/**
 * Builds the real Gemini client from server env. Throws if GEMINI_API_KEY is
 * missing. Pass `extraOnLog` (e.g. a per-plan metrics collector) to observe usage
 * in addition to the standard structured log.
 */
export function buildGeminiClient(extraOnLog?: LogHook): GeminiClient {
  return createGeminiClient({
    apiKey: getEnv().GEMINI_API_KEY,
    onLog: extraOnLog
      ? (e) => {
          logLLMUsage(e);
          extraOnLog(e);
        }
      : logLLMUsage,
  });
}

// Process-wide destination-research cache shared across requests.
let _cache: DestinationCache | null = null;
export function getDestinationCache(): DestinationCache {
  if (!_cache) _cache = createInMemoryDestinationCache();
  return _cache;
}
