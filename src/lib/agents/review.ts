import {
  type BudgetBreakdown,
  type Category,
  type ItineraryDay,
  type LogisticsPlan,
  type ReviewCheck,
  type ReviewResult,
  type TripConstraints,
} from "@/lib/types";
import { isNonBacktrackingSequence } from "./logistics";

export interface ReviewInput {
  constraints: TripConstraints;
  itinerary: ItineraryDay[];
  budget: BudgetBreakdown;
  logistics: LogisticsPlan;
}

// Preference keywords that map directly to an itinerary item category.
const CATEGORY_PREFS: Record<string, Category> = {
  food: "food",
  foods: "food",
  eat: "food",
  eating: "food",
  cuisine: "food",
  temple: "temple",
  temples: "temple",
  shrine: "temple",
  shrines: "temple",
  experience: "experience",
  experiences: "experience",
  activity: "experience",
  activities: "experience",
};

/**
 * Review agent — the quality gate. Runs the PRD's six checks **deterministically**
 * (no LLM call): a code gate cannot be fooled by the model grading its own output,
 * and it makes the pipeline's bounded re-plan loop reproducible.
 *
 * A failing hard check (`status: "fail"`) makes `overall: "fail"`, which the
 * pipeline uses to trigger a re-plan. Soft issues use `status: "warning"` and do
 * not fail the plan (e.g. partial crowd avoidance).
 */
export class ReviewAgent {
  readonly name = "review";

  review(input: ReviewInput): ReviewResult {
    const { constraints, itinerary, budget, logistics } = input;
    const checks: ReviewCheck[] = [
      this.checkDuration(constraints, itinerary),
      this.checkCities(constraints, itinerary),
      this.checkBudget(constraints, budget),
      this.checkPreferences(constraints, itinerary),
      this.checkCrowds(constraints, itinerary),
      this.checkTravelTime(logistics),
    ];

    const overall: ReviewResult["overall"] = checks.some((c) => c.status === "fail")
      ? "fail"
      : "pass";
    const caveats = checks.filter((c) => c.status !== "pass").map((c) => c.reason);

    return { overall, checks, caveats: caveats.length > 0 ? caveats : undefined };
  }

  private checkDuration(c: TripConstraints, itinerary: ItineraryDay[]): ReviewCheck {
    const ok = itinerary.length === c.duration_days;
    return {
      check: "fits_duration",
      status: ok ? "pass" : "fail",
      reason: `Plan spans ${itinerary.length} day(s); requested ${c.duration_days}.`,
      suggested_fix: ok ? undefined : "Adjust the day sequence to match the requested length.",
    };
  }

  private checkCities(c: TripConstraints, itinerary: ItineraryDay[]): ReviewCheck {
    const planned = new Set(itinerary.map((d) => d.city.trim().toLowerCase()));
    const missing = c.cities.filter((city) => !planned.has(city.trim().toLowerCase()));
    const ok = missing.length === 0;
    return {
      check: "includes_all_cities",
      status: ok ? "pass" : "fail",
      reason: ok
        ? "All requested cities are included."
        : `Missing requested cit${missing.length === 1 ? "y" : "ies"}: ${missing.join(", ")}.`,
      suggested_fix: ok ? undefined : `Add day(s) in ${missing.join(", ")}.`,
    };
  }

  private checkBudget(c: TripConstraints, budget: BudgetBreakdown): ReviewCheck {
    const ok = budget.within_budget && budget.total_usd <= c.budget_usd;
    return {
      check: "within_budget",
      status: ok ? "pass" : "fail",
      reason: `Estimated total $${budget.total_usd} of $${c.budget_usd} budget.`,
      suggested_fix: ok
        ? undefined
        : budget.cheaper_alternatives?.[0] ?? "Choose cheaper stays or swap paid activities for free ones.",
    };
  }

  private checkPreferences(c: TripConstraints, itinerary: ItineraryDay[]): ReviewCheck {
    const categories = new Set<string>();
    const textParts: string[] = [];
    for (const day of itinerary) {
      for (const item of day.items) {
        categories.add(item.category);
        textParts.push(
          `${item.title} ${item.description} ${item.tips ?? ""} ${item.location ?? ""}`.toLowerCase()
        );
      }
    }
    const blob = textParts.join(" ");

    const uncovered = c.preferences.filter((pref) => {
      const key = pref.trim().toLowerCase();
      const cat = CATEGORY_PREFS[key];
      return cat ? !categories.has(cat) : !blob.includes(key);
    });
    const ok = uncovered.length === 0;
    return {
      check: "matches_preferences",
      status: ok ? "pass" : "fail",
      reason: ok
        ? `Itinerary reflects stated preferences: ${c.preferences.join(", ") || "(none)"}.`
        : `Preferences not clearly reflected: ${uncovered.join(", ")}.`,
      suggested_fix: ok ? undefined : `Add items addressing: ${uncovered.join(", ")}.`,
    };
  }

  private checkCrowds(c: TripConstraints, itinerary: ItineraryDay[]): ReviewCheck {
    const wantsQuiet = c.avoidances.some((a) => /crowd/i.test(a));
    if (!wantsQuiet) {
      return {
        check: "avoids_crowds",
        status: "pass",
        reason: "No crowd-avoidance was requested.",
      };
    }
    const unmitigated = itinerary
      .flatMap((d) => d.items)
      .filter((it) => it.priority === "must-do" && it.crowd_level === "high" && !it.tips);
    const ok = unmitigated.length === 0;
    return {
      check: "avoids_crowds",
      // Soft check: partial crowd avoidance is a warning, not a hard failure.
      status: ok ? "pass" : "warning",
      reason: ok
        ? "Busy must-see sites include off-peak timing guidance."
        : `${unmitigated.length} busy must-see(s) lack an off-peak tip.`,
      suggested_fix: ok ? undefined : "Add early/late timing tips for the busiest sites.",
    };
  }

  private checkTravelTime(logistics: LogisticsPlan): ReviewCheck {
    const ok = isNonBacktrackingSequence(logistics.day_sequence, logistics.stays);
    return {
      check: "travel_time_realistic",
      status: ok ? "pass" : "fail",
      reason: ok
        ? "City order is contiguous — no needless backtracking."
        : "City sequence backtracks, adding avoidable travel time.",
      suggested_fix: ok ? undefined : "Reorder the days so each city is visited in one block.",
    };
  }
}

export function createReviewAgent(): ReviewAgent {
  return new ReviewAgent();
}
