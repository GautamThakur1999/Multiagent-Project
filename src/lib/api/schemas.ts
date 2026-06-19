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

/** Structured API error body. */
export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}
