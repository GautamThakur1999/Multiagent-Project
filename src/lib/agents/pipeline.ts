import type { GeminiClient } from "@/lib/gemini/client";
import {
  type BudgetBreakdown,
  type DaySequenceEntry,
  type DestinationRecommendation,
  type DestinationResearch,
  type ItineraryDay,
  type ItineraryItem,
  type LogisticsLeg,
  type LogisticsPlan,
  type StayRecommendation,
  type TimeBlock,
  type TripConstraints,
  type TripState,
  TripStateSchema,
} from "@/lib/types";
import { DestinationResearchAgent, avoidsCrowds } from "./destinationResearch";
import { LogisticsAgent } from "./logistics";
import { BudgetAgent } from "./budget";
import { ReviewAgent } from "./review";

const TIME_BLOCKS: TimeBlock[] = ["morning", "afternoon", "evening"];

function itemsPerDayForPace(pace: TripConstraints["pace"]): number {
  return pace === "slow" ? 2 : pace === "fast" ? 4 : 3;
}

function priorityRank(p: DestinationRecommendation["priority"]): number {
  return p === "must-do" ? 0 : 1;
}

function crowdRank(c: DestinationRecommendation["crowd_level"]): number {
  return c === "low" ? 0 : c === "medium" ? 1 : 2;
}

/** Splits `arr` across `buckets`, as evenly as possible, capped at `perBucket` each. */
function distribute<T>(arr: T[], buckets: number, perBucket: number): T[][] {
  const result: T[][] = Array.from({ length: buckets }, () => []);
  const max = Math.min(arr.length, buckets * perBucket);
  const base = Math.floor(max / buckets);
  let extra = max % buckets;
  let idx = 0;
  for (let b = 0; b < buckets; b++) {
    let take = base + (extra > 0 ? 1 : 0);
    if (extra > 0) extra--;
    while (take-- > 0) result[b].push(arr[idx++]);
  }
  return result;
}

function recToItem(rec: DestinationRecommendation): Omit<ItineraryItem, "time_block"> {
  return {
    title: rec.name,
    description: rec.description,
    category: rec.category,
    priority: rec.priority,
    est_cost_usd: rec.est_cost_usd,
    location: rec.neighborhood,
    crowd_level: rec.crowd_level,
    tips: rec.off_peak_tip,
  };
}

function legToItem(leg: LogisticsLeg): Omit<ItineraryItem, "time_block"> {
  const hours = Math.floor(leg.duration_minutes / 60);
  const mins = leg.duration_minutes % 60;
  const dur = hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ""}` : `${mins}m`;
  return {
    title: `${leg.mode}: ${leg.from} → ${leg.to}`,
    description: leg.notes ?? `Travel from ${leg.from} to ${leg.to} (~${dur}).`,
    category: "logistics",
    priority: "must-do",
    est_cost_usd: leg.est_cost_usd,
    location: leg.from,
  };
}

function fallbackItem(city: string): ItineraryItem {
  return {
    title: `Explore ${city}`,
    description: `Free time to wander ${city} at your own pace.`,
    category: "experience",
    priority: "nice-to-have",
    est_cost_usd: 0,
    time_block: "morning",
  };
}

/**
 * Deterministically merges the destination recommendations and logistics plan
 * into a day-by-day itinerary. Each day's city comes from the logistics
 * `day_sequence`; recommendations for that city are spread across its days
 * (must-do first, quietest-first when avoiding crowds), and the inter-city leg
 * is surfaced as a logistics item on the transfer day. Every day gets ≥1 item.
 */
export function buildDraftItinerary(
  constraints: TripConstraints,
  destination: DestinationResearch,
  logistics: LogisticsPlan
): ItineraryDay[] {
  const seq = [...logistics.day_sequence].sort((a, b) => a.day - b.day);

  // Group consecutive same-city days into contiguous blocks.
  const blocks: { city: string; days: DaySequenceEntry[] }[] = [];
  for (const entry of seq) {
    const last = blocks[blocks.length - 1];
    if (last && last.city.trim().toLowerCase() === entry.city.trim().toLowerCase()) {
      last.days.push(entry);
    } else {
      blocks.push({ city: entry.city, days: [entry] });
    }
  }

  // Queue of recommendations per city, prioritized.
  const wantsQuiet = avoidsCrowds(constraints);
  const recsByCity = new Map<string, DestinationRecommendation[]>();
  for (const rec of destination.recommendations) {
    const key = rec.city.trim().toLowerCase();
    const list = recsByCity.get(key) ?? [];
    list.push(rec);
    recsByCity.set(key, list);
  }
  for (const list of recsByCity.values()) {
    list.sort(
      (a, b) =>
        priorityRank(a.priority) - priorityRank(b.priority) ||
        (wantsQuiet ? crowdRank(a.crowd_level) - crowdRank(b.crowd_level) : 0)
    );
  }

  const perDayCap = itemsPerDayForPace(constraints.pace);
  const days: ItineraryDay[] = [];
  let prevCity: string | null = null;

  for (const block of blocks) {
    const queue = recsByCity.get(block.city.trim().toLowerCase()) ?? [];
    const spread = distribute(queue, block.days.length, perDayCap);

    block.days.forEach((entry, dayIdx) => {
      const raw: Array<Omit<ItineraryItem, "time_block">> = [];

      // Surface the inter-city leg on the first day of a new city block.
      if (dayIdx === 0 && prevCity && prevCity.toLowerCase() !== block.city.toLowerCase()) {
        const leg = logistics.legs.find(
          (l) =>
            l.leg_type === "inter-city" &&
            l.from.trim().toLowerCase() === prevCity!.trim().toLowerCase() &&
            l.to.trim().toLowerCase() === block.city.trim().toLowerCase()
        );
        if (leg) raw.push(legToItem(leg));
      }

      for (const rec of spread[dayIdx]) raw.push(recToItem(rec));

      const items: ItineraryItem[] =
        raw.length > 0
          ? raw.map((it, i) => ({ ...it, time_block: TIME_BLOCKS[Math.min(i, TIME_BLOCKS.length - 1)] }))
          : [fallbackItem(block.city)];

      days.push({
        day: entry.day,
        city: block.city,
        date_label: `Day ${entry.day}`,
        items,
      });
    });

    prevCity = block.city;
  }

  return days;
}

// --- Parallel fan-out with graceful degradation ----------------------------

interface PipelineAgents {
  destination: DestinationResearchAgent;
  logistics: LogisticsAgent;
  budget: BudgetAgent;
  review: ReviewAgent;
}

export function buildPipelineAgents(client: GeminiClient): PipelineAgents {
  return {
    destination: new DestinationResearchAgent(client),
    logistics: new LogisticsAgent(client),
    budget: new BudgetAgent(client),
    review: new ReviewAgent(),
  };
}

function fallbackLogistics(c: TripConstraints): LogisticsPlan {
  const day_sequence: DaySequenceEntry[] = [];
  const stays: StayRecommendation[] = [];
  const base = Math.floor(c.duration_days / c.cities.length);
  let extra = c.duration_days % c.cities.length;
  let day = 1;
  for (const city of c.cities) {
    const n = base + (extra > 0 ? 1 : 0);
    if (extra > 0) extra--;
    for (let k = 0; k < n; k++) day_sequence.push({ day: day++, city });
    if (n > 0) {
      stays.push({
        city,
        neighborhood: `${city} (central)`,
        rationale: "Approximate stay — detailed logistics were unavailable.",
        price_range_usd_per_night: { min: 0, max: 0 },
        nights: Math.max(1, n),
      });
    }
  }
  const legs: LogisticsLeg[] = [];
  for (let i = 1; i < c.cities.length; i++) {
    legs.push({
      from: c.cities[i - 1],
      to: c.cities[i],
      mode: "Transit",
      duration_minutes: 120,
      est_cost_usd: 0,
      leg_type: "inter-city",
      notes: "Approximate routing — detailed logistics were unavailable.",
    });
  }
  return { stays, legs, day_sequence, summary: "Approximate logistics (agent unavailable)." };
}

function fallbackBudget(): BudgetBreakdown {
  return {
    stay_usd: 0,
    transport_usd: 0,
    food_usd: 0,
    activities_usd: 0,
    total_usd: 0,
    within_budget: true,
    notes: "A cost estimate was unavailable for this plan.",
  };
}

interface FanOutResult {
  destination: DestinationResearch;
  logistics: LogisticsPlan;
  budget: BudgetBreakdown;
  caveats: string[];
}

/** Runs the three specialists concurrently, degrading gracefully on any failure. */
async function fanOut(
  constraints: TripConstraints,
  agents: PipelineAgents
): Promise<FanOutResult> {
  const [dRes, lRes, bRes] = await Promise.allSettled([
    agents.destination.run(constraints),
    agents.logistics.run(constraints),
    agents.budget.run(constraints),
  ]);

  const caveats: string[] = [];

  let destination: DestinationResearch;
  if (dRes.status === "fulfilled") {
    destination = dRes.value.data;
  } else {
    destination = { recommendations: [] };
    caveats.push(
      "Fresh destination recommendations were unavailable, so this plan uses limited suggestions."
    );
  }

  let logistics: LogisticsPlan;
  if (lRes.status === "fulfilled") {
    logistics = lRes.value.data;
  } else {
    logistics = fallbackLogistics(constraints);
    caveats.push("Detailed logistics were unavailable, so stays and routing are approximate.");
  }

  let budget: BudgetBreakdown;
  if (bRes.status === "fulfilled") {
    budget = bRes.value.data;
  } else {
    budget = fallbackBudget();
    caveats.push("A cost estimate was unavailable for this plan.");
  }

  return { destination, logistics, budget, caveats };
}

export interface PipelineOptions {
  /** Max re-plan attempts after the first pass (PRD: bounded, default 2). */
  maxReplans?: number;
}

/**
 * The Orchestrator's full synthesis:
 * `Orchestrator → [Destination, Logistics, Budget in parallel] → Review → (loop)`.
 * Builds a draft itinerary, runs the Review gate, and re-plans (bounded) on
 * failure before delivering a best-effort plan with caveats.
 */
export async function runPipeline(
  constraints: TripConstraints,
  client: GeminiClient,
  options: PipelineOptions = {}
): Promise<TripState> {
  const maxReplans = options.maxReplans ?? 2;
  const agents = buildPipelineAgents(client);

  const caveats: string[] = [];
  let replanCount = 0;

  let fan = await fanOut(constraints, agents);
  caveats.push(...fan.caveats);
  let itinerary = buildDraftItinerary(constraints, fan.destination, fan.logistics);
  let review = agents.review.review({
    constraints,
    itinerary,
    budget: fan.budget,
    logistics: fan.logistics,
  });

  while (review.overall === "fail" && replanCount < maxReplans) {
    replanCount++;
    // Re-plan: re-run the full fan-out (feedback-targeted re-planning is a
    // future refinement — see handover).
    fan = await fanOut(constraints, agents);
    caveats.push(...fan.caveats);
    itinerary = buildDraftItinerary(constraints, fan.destination, fan.logistics);
    review = agents.review.review({
      constraints,
      itinerary,
      budget: fan.budget,
      logistics: fan.logistics,
    });
  }

  if (review.overall === "fail") {
    caveats.push(
      "We couldn't satisfy every constraint after retrying — this is the closest plan we could build. See the review notes for what to adjust."
    );
  }

  const allCaveats = Array.from(new Set([...caveats, ...(review.caveats ?? [])]));

  return TripStateSchema.parse({
    constraints,
    stay_recommendations: fan.logistics.stays,
    logistics_legs: fan.logistics.legs,
    budget_breakdown: fan.budget,
    draft_itinerary: itinerary,
    final_itinerary: itinerary,
    review_result: review,
    has_caveats: allCaveats.length > 0,
    caveats: allCaveats,
    replan_count: replanCount,
  });
}
