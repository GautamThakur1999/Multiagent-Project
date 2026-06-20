import { z } from "zod";
import { TripConstraintsSchema } from "@/lib/types";

/** `POST /api/parse` body — a raw natural-language travel request. */
export const ParseRequestSchema = z.object({
  request: z.string(),
});
export type ParseRequest = z.infer<typeof ParseRequestSchema>;

/** `POST /api/plan` body — already-confirmed constraints (from the parse step). */
export const PlanRequestSchema = z.object({
  constraints: TripConstraintsSchema,
});
export type PlanRequest = z.infer<typeof PlanRequestSchema>;

/** `POST /api/regenerate-day` body. */
export const RegenerateDayRequestSchema = z.object({
  constraints: TripConstraintsSchema,
  day: z.number().int().positive(),
});
export type RegenerateDayRequest = z.infer<typeof RegenerateDayRequestSchema>;

/** `POST /api/cheaper` body. */
export const CheaperRequestSchema = z.object({
  constraints: TripConstraintsSchema,
});
export type CheaperRequest = z.infer<typeof CheaperRequestSchema>;

/** Structured API error body. */
export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}
