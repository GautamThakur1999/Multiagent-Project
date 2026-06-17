/**
 * Base agent abstraction used by all five specialist agents (Orchestrator,
 * DestinationResearch, Logistics, Budget, Review).
 *
 * @example
 * ```ts
 * class OrchestratorAgent implements BaseAgent<string, TripConstraints> {
 *   readonly name = "orchestrator";
 *   async run(input: string): Promise<AgentResult<TripConstraints>> {
 *     const data = await this.client.generateStructured(buildPrompt(input), TripConstraintsSchema);
 *     return { data, confidence: 0.95 };
 *   }
 * }
 * ```
 */

/** Wrapper returned by every agent — carries the result plus metadata. */
export interface AgentResult<T> {
  data: T;
  /** Confidence in result quality: 1.0 = fully verified, < 0.7 = surface caveats to user. */
  confidence: number;
  /** Source references: fixture keys, URLs, or "gemini-synthesized". */
  citations?: string[];
}

/** Every agent implements this interface. TInput and TOutput are agent-specific. */
export interface BaseAgent<TInput, TOutput> {
  readonly name: string;
  run(input: TInput): Promise<AgentResult<TOutput>>;
}

/** Thrown when an agent fails — wraps the underlying cause with agent context. */
export class AgentError extends Error {
  constructor(
    public readonly agentName: string,
    public readonly cause: unknown,
    message?: string
  ) {
    super(message ?? `Agent "${agentName}" failed: ${String(cause)}`);
    this.name = "AgentError";
  }
}
