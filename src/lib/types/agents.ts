import { z } from "zod";
import { CategorySchema, CrowdLevelSchema, PrioritySchema } from "./itinerary";

export const StayRecommendationSchema = z.object({
  city: z.string().min(1),
  neighborhood: z.string().min(1),
  rationale: z.string(),
  price_range_usd_per_night: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }),
  nights: z.number().int().positive(),
  hotel_suggestions: z.array(z.string()).optional(),
});
export type StayRecommendation = z.infer<typeof StayRecommendationSchema>;

export const LogisticsLegSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  mode: z.string().min(1),
  duration_minutes: z.number().int().positive(),
  est_cost_usd: z.number().min(0),
  notes: z.string().optional(),
  leg_type: z.enum(["inter-city", "intra-city"]),
  booking_required: z.boolean().optional(),
});
export type LogisticsLeg = z.infer<typeof LogisticsLegSchema>;

export const BudgetBreakdownSchema = z.object({
  stay_usd: z.number().min(0),
  transport_usd: z.number().min(0),
  food_usd: z.number().min(0),
  activities_usd: z.number().min(0),
  total_usd: z.number().min(0),
  within_budget: z.boolean(),
  overspend_usd: z.number().optional(),
  cheaper_alternatives: z.array(z.string()).optional(),
  notes: z.string().optional(),
});
export type BudgetBreakdown = z.infer<typeof BudgetBreakdownSchema>;

export const ReviewCheckSchema = z.object({
  check: z.string().min(1),
  status: z.enum(["pass", "fail", "warning"]),
  reason: z.string(),
  suggested_fix: z.string().optional(),
});
export type ReviewCheck = z.infer<typeof ReviewCheckSchema>;

export const ReviewResultSchema = z.object({
  overall: z.enum(["pass", "fail"]),
  checks: z.array(ReviewCheckSchema),
  caveats: z.array(z.string()).optional(),
});
export type ReviewResult = z.infer<typeof ReviewResultSchema>;

// --- Destination Research agent output (Sprint 4) ---------------------------

export const DestinationRecommendationSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  category: CategorySchema,
  neighborhood: z.string().optional(),
  description: z.string(),
  priority: PrioritySchema,
  crowd_level: CrowdLevelSchema,
  best_time: z.string().optional(),
  off_peak_tip: z.string().optional(),
  est_cost_usd: z.number().min(0),
});
export type DestinationRecommendation = z.infer<typeof DestinationRecommendationSchema>;

export const DestinationResearchSchema = z.object({
  recommendations: z.array(DestinationRecommendationSchema).min(1),
  summary: z.string().optional(),
});
export type DestinationResearch = z.infer<typeof DestinationResearchSchema>;

// --- Logistics agent output (Sprint 4) --------------------------------------

export const DaySequenceEntrySchema = z.object({
  day: z.number().int().positive(),
  city: z.string().min(1),
  note: z.string().optional(),
});
export type DaySequenceEntry = z.infer<typeof DaySequenceEntrySchema>;

export const LogisticsPlanSchema = z.object({
  stays: z.array(StayRecommendationSchema).min(1),
  legs: z.array(LogisticsLegSchema),
  day_sequence: z.array(DaySequenceEntrySchema).min(1),
  summary: z.string().optional(),
});
export type LogisticsPlan = z.infer<typeof LogisticsPlanSchema>;
