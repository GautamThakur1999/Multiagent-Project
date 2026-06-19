import type { DestinationResearch, TripConstraints } from "@/lib/types";
import { type AgentResult, type BaseAgent } from "./base";

/**
 * Cache for Destination Research results. Keyed by the inputs that change the
 * recommendations — destination, cities, preferences, avoidances — so repeated
 * plans for the same place/taste skip a Gemini call (PRD cost/latency mitigation).
 */
export interface DestinationCache {
  get(key: string): DestinationResearch | undefined;
  set(key: string, value: DestinationResearch): void;
}

/** Stable cache key, order-insensitive across array fields. */
export function destinationCacheKey(c: TripConstraints): string {
  const norm = (xs: string[]) => [...xs].map((x) => x.trim().toLowerCase()).sort();
  return JSON.stringify({
    destination: c.destination.trim().toLowerCase(),
    cities: norm(c.cities),
    preferences: norm(c.preferences),
    avoidances: norm(c.avoidances),
  });
}

export function createInMemoryDestinationCache(): DestinationCache & { clear(): void } {
  const store = new Map<string, DestinationResearch>();
  return {
    get: (key) => store.get(key),
    set: (key, value) => {
      store.set(key, value);
    },
    clear: () => store.clear(),
  };
}

/**
 * Wraps a Destination Research agent with a cache. On a hit it returns the cached
 * recommendations without calling the model; on a miss it delegates and stores.
 */
export class CachingDestinationAgent
  implements BaseAgent<TripConstraints, DestinationResearch>
{
  readonly name = "destination-research";

  constructor(
    private readonly inner: BaseAgent<TripConstraints, DestinationResearch>,
    private readonly cache: DestinationCache
  ) {}

  async run(constraints: TripConstraints): Promise<AgentResult<DestinationResearch>> {
    const key = destinationCacheKey(constraints);
    const cached = this.cache.get(key);
    if (cached) {
      return { data: cached, confidence: 1, citations: ["cache"] };
    }
    const result = await this.inner.run(constraints);
    this.cache.set(key, result.data);
    return result;
  }
}
