import { z } from "zod";
import type { GeminiClient } from "@/lib/gemini/client";
import {
  PaceSchema,
  TripConstraintsSchema,
  type TripConstraints,
  type TripState,
} from "@/lib/types";
import { buildExtractionPrompt } from "@/lib/prompts/orchestrator";

/**
 * Permissive schema for the raw LLM extraction. Hard constraints are nullable so
 * the model is never forced to invent a duration/budget/city it wasn't given —
 * those gaps surface as `clarifications_needed` instead. This is intentionally
 * looser than `TripConstraintsSchema` (which is the validated, complete form).
 */
export const ExtractionSchema = z.object({
  destination: z.string().nullable(),
  duration_days: z.number().int().positive().nullable(),
  cities: z.array(z.string()).nullable(),
  budget_usd: z.number().positive().nullable(),
  currency: z.string().nullable(),
  preferences: z.array(z.string()),
  avoidances: z.array(z.string()),
  travelers: z.number().int().positive().nullable(),
  pace: PaceSchema.nullable(),
  clarifications_needed: z.array(z.string()),
});
export type Extraction = z.infer<typeof ExtractionSchema>;

/** Whatever the orchestrator managed to extract — used to pre-fill the UI. */
export type PartialConstraints = Partial<Omit<TripConstraints, "clarifications_needed">>;

/**
 * Outcome of constraint extraction.
 * - `complete`: all hard constraints present and unambiguous → validated `TripConstraints`.
 * - `needs_clarification`: something is missing/ambiguous/conflicting → questions for the user.
 *
 * (The plan sketched `extractConstraints(): Promise<TripConstraints>`, but the
 * Sprint 2 `TripConstraintsSchema` requires duration/cities/budget, so a partial
 * request genuinely cannot be a valid `TripConstraints`. A discriminated union
 * keeps the strict schema intact while honestly representing under-specified input.)
 */
export type ExtractionResult =
  | { status: "complete"; constraints: TripConstraints }
  | {
      status: "needs_clarification";
      clarifications_needed: string[];
      partial: PartialConstraints;
    };

function dedupe(items: string[]): string[] {
  return Array.from(new Set(items.map((s) => s.trim()).filter(Boolean)));
}

/** Drops null/empty/whitespace-only city strings. */
function cleanCities(cities: string[] | null): string[] {
  return (cities ?? []).map((c) => c.trim()).filter(Boolean);
}

function buildPartial(ex: Extraction): PartialConstraints {
  const p: PartialConstraints = {};
  const destination = ex.destination?.trim();
  const cities = cleanCities(ex.cities);
  if (destination) p.destination = destination;
  if (ex.duration_days != null) p.duration_days = ex.duration_days;
  if (cities.length > 0) p.cities = cities;
  if (ex.budget_usd != null) p.budget_usd = ex.budget_usd;
  if (ex.currency) p.currency = ex.currency;
  if (ex.preferences.length > 0) p.preferences = ex.preferences;
  if (ex.avoidances.length > 0) p.avoidances = ex.avoidances;
  if (ex.travelers != null) p.travelers = ex.travelers;
  if (ex.pace) p.pace = ex.pace;
  return p;
}

/**
 * The Orchestrator agent. Phase 1 (this sprint) is constraint extraction;
 * phase 2 (`synthesize`, Sprint 5) runs the specialist pipeline and merges results.
 *
 * The Gemini client is injected so tests can supply a mock (no live API calls).
 */
export class OrchestratorAgent {
  readonly name = "orchestrator";

  constructor(private readonly client: GeminiClient) {}

  /**
   * Turns a raw natural-language request into either validated constraints or a
   * set of clarifying questions. Never invents hard constraints.
   */
  async extractConstraints(request: string): Promise<ExtractionResult> {
    const trimmed = request.trim();
    if (trimmed.length === 0) {
      return {
        status: "needs_clarification",
        clarifications_needed: [
          "Please describe the trip you'd like to plan — destination, rough dates or length, budget, and what you enjoy.",
        ],
        partial: {},
      };
    }

    const prompt = buildExtractionPrompt(trimmed);
    const ex = await this.client.generateStructured(prompt, ExtractionSchema);

    const destination = ex.destination?.trim() ?? "";
    // Normalize cities so `[]` and `[""]` are treated identically — otherwise an
    // empty-string city slips past the length check and fails strict validation.
    const cities = cleanCities(ex.cities);

    // If we can't even identify a destination, the request is too vague or not a
    // travel request at all. Ask ONE question rather than one per missing field.
    if (!destination) {
      const clarifications = dedupe(
        ex.clarifications_needed.length > 0
          ? ex.clarifications_needed
          : [
              "Which destination would you like to plan a trip to? Tell me the place, rough length, budget, and what you enjoy.",
            ]
      );
      return {
        status: "needs_clarification",
        clarifications_needed: clarifications,
        partial: buildPartial(ex),
      };
    }

    // Destination known — ask only for the specific hard constraints still missing.
    const missing: string[] = [];
    if (ex.duration_days == null) {
      missing.push("How many days will your trip be?");
    }
    if (cities.length === 0) {
      missing.push("Which cities or areas would you like to visit?");
    }
    if (ex.budget_usd == null) {
      missing.push("What is your total budget (and in which currency)?");
    }

    const clarifications = dedupe([...ex.clarifications_needed, ...missing]);

    if (clarifications.length > 0) {
      return {
        status: "needs_clarification",
        clarifications_needed: clarifications,
        partial: buildPartial(ex),
      };
    }

    // All hard constraints present and no open questions → validate into the
    // strict, complete form. `safeParse` so an unexpected shape never throws a
    // raw ZodError out of the orchestrator.
    const parsed = TripConstraintsSchema.safeParse({
      destination,
      duration_days: ex.duration_days,
      cities,
      budget_usd: ex.budget_usd,
      currency: ex.currency ?? "USD",
      preferences: ex.preferences,
      avoidances: ex.avoidances,
      travelers: ex.travelers ?? 1,
      pace: ex.pace ?? "moderate",
      clarifications_needed: [],
    });

    if (!parsed.success) {
      return {
        status: "needs_clarification",
        clarifications_needed: [
          "Some details looked inconsistent — could you restate your destination, trip length, and budget?",
        ],
        partial: buildPartial(ex),
      };
    }

    return { status: "complete", constraints: parsed.data };
  }

  /**
   * TODO(Sprint 5): Full synthesis. Runs the Destination, Logistics, and Budget
   * agents in parallel, merges their outputs into a draft itinerary, runs the
   * Review agent, and loops the re-plan on failure (bounded). Wired in Sprint 5
   * — see ImplementationPlan.md §"SPRINT 5".
   */
  async synthesize(constraints: TripConstraints): Promise<TripState> {
    void constraints; // consumed in Sprint 5; referenced now to satisfy lint
    throw new Error(
      "OrchestratorAgent.synthesize() is not implemented until Sprint 5."
    );
  }
}

/** Convenience factory mirroring the other agents' construction style. */
export function createOrchestratorAgent(client: GeminiClient): OrchestratorAgent {
  return new OrchestratorAgent(client);
}
