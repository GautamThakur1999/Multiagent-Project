import { z } from "zod";
import { BudgetBreakdownSchema, LogisticsLegSchema, ReviewResultSchema, StayRecommendationSchema } from "./agents";
import { ItineraryDaySchema } from "./itinerary";

export const PaceSchema = z.enum(["slow", "moderate", "fast"]);
export type Pace = z.infer<typeof PaceSchema>;

export const TripConstraintsSchema = z.object({
  destination: z.string().min(1),
  duration_days: z.number().int().positive(),
  cities: z.array(z.string().min(1)).min(1),
  budget_usd: z.number().positive(),
  currency: z.string().default("USD"),
  preferences: z.array(z.string()),
  avoidances: z.array(z.string()),
  travelers: z.number().int().positive().default(1),
  pace: PaceSchema.default("moderate"),
  clarifications_needed: z.array(z.string()).default([]),
});
export type TripConstraints = z.infer<typeof TripConstraintsSchema>;

// TripState is the aggregate that flows through the multi-agent pipeline.
// All per-agent outputs are optional — filled in progressively.
export const TripStateSchema = z.object({
  constraints: TripConstraintsSchema,
  stay_recommendations: z.array(StayRecommendationSchema).optional(),
  logistics_legs: z.array(LogisticsLegSchema).optional(),
  budget_breakdown: BudgetBreakdownSchema.optional(),
  draft_itinerary: z.array(ItineraryDaySchema).optional(),
  final_itinerary: z.array(ItineraryDaySchema).optional(),
  review_result: ReviewResultSchema.optional(),
  has_caveats: z.boolean().default(false),
  caveats: z.array(z.string()).default([]),
  replan_count: z.number().int().min(0).default(0),
});
export type TripState = z.infer<typeof TripStateSchema>;
