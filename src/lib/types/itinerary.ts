import { z } from "zod";

export const CategorySchema = z.enum(["food", "temple", "experience", "logistics"]);
export type Category = z.infer<typeof CategorySchema>;

export const PrioritySchema = z.enum(["must-do", "nice-to-have"]);
export type Priority = z.infer<typeof PrioritySchema>;

export const TimeBlockSchema = z.enum(["morning", "afternoon", "evening"]);
export type TimeBlock = z.infer<typeof TimeBlockSchema>;

export const CrowdLevelSchema = z.enum(["low", "medium", "high"]);
export type CrowdLevel = z.infer<typeof CrowdLevelSchema>;

export const ItineraryItemSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  category: CategorySchema,
  priority: PrioritySchema,
  est_cost_usd: z.number().min(0),
  time_block: TimeBlockSchema,
  location: z.string().optional(),
  crowd_level: CrowdLevelSchema.optional(),
  tips: z.string().optional(),
});
export type ItineraryItem = z.infer<typeof ItineraryItemSchema>;

export const ItineraryDaySchema = z.object({
  day: z.number().int().positive(),
  city: z.string().min(1),
  date_label: z.string().optional(),
  theme: z.string().optional(),
  items: z.array(ItineraryItemSchema).min(1),
});
export type ItineraryDay = z.infer<typeof ItineraryDaySchema>;
