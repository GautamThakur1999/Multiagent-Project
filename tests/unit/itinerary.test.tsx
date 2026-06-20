import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DayCard } from "@/components/DayCard";
import { ComplianceCard } from "@/components/ComplianceCard";
import { BudgetCard } from "@/components/BudgetCard";
import { LogisticsCard } from "@/components/LogisticsCard";
import { PlanProgress } from "@/components/PlanProgress";
import { ItineraryView } from "@/components/ItineraryView";
import { PlanProvider } from "@/components/PlanProvider";
import type { ProgressEvent } from "@/lib/agents/pipeline";
import type { ItineraryDay, TripState } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

afterEach(cleanup);

function renderItinerary(state: TripState) {
  return render(
    <PlanProvider>
      <ItineraryView state={state} />
    </PlanProvider>
  );
}

const DAY1: ItineraryDay = {
  day: 1,
  city: "Tokyo",
  date_label: "Day 1",
  items: [
    { title: "Senso-ji", description: "Tokyo's oldest temple.", category: "temple", priority: "must-do", est_cost_usd: 0, time_block: "morning", crowd_level: "high", tips: "Go at dawn." },
    { title: "Tsukiji Market", description: "Sushi breakfast.", category: "food", priority: "must-do", est_cost_usd: 25, time_block: "afternoon" },
  ],
};

const TRIP: TripState = {
  constraints: {
    destination: "Japan", duration_days: 2, cities: ["Tokyo", "Kyoto"], budget_usd: 3000, currency: "USD",
    preferences: ["food", "temples"], avoidances: ["crowds"], travelers: 1, pace: "moderate", clarifications_needed: [],
  },
  stay_recommendations: [
    { city: "Tokyo", neighborhood: "Yanaka", rationale: "Quiet.", price_range_usd_per_night: { min: 80, max: 150 }, nights: 1 },
    { city: "Kyoto", neighborhood: "Ohara", rationale: "Quiet.", price_range_usd_per_night: { min: 90, max: 170 }, nights: 1 },
  ],
  logistics_legs: [
    { from: "Tokyo", to: "Kyoto", mode: "Shinkansen", duration_minutes: 135, est_cost_usd: 95, leg_type: "inter-city" },
  ],
  budget_breakdown: { stay_usd: 560, transport_usd: 190, food_usd: 400, activities_usd: 100, total_usd: 1250, within_budget: true },
  draft_itinerary: [DAY1],
  final_itinerary: [
    DAY1,
    { day: 2, city: "Kyoto", date_label: "Day 2", items: [
      { title: "Shinkansen: Tokyo → Kyoto", description: "~2h15m.", category: "logistics", priority: "must-do", est_cost_usd: 95, time_block: "morning" },
      { title: "Fushimi Inari", description: "Torii gates.", category: "temple", priority: "must-do", est_cost_usd: 0, time_block: "afternoon", tips: "Dawn." },
    ] },
  ],
  review_result: { overall: "pass", checks: [
    { check: "fits_duration", status: "pass", reason: "2 days." },
    { check: "includes_all_cities", status: "pass", reason: "Tokyo, Kyoto." },
    { check: "within_budget", status: "pass", reason: "$1250 of $3000." },
    { check: "matches_preferences", status: "pass", reason: "food, temples." },
    { check: "avoids_crowds", status: "pass", reason: "mitigated." },
    { check: "travel_time_realistic", status: "pass", reason: "contiguous." },
  ] },
  has_caveats: false,
  caveats: [],
  replan_count: 0,
};

describe("DayCard", () => {
  it("renders the day, items, tags, pills and costs", () => {
    render(<DayCard day={DAY1} />);
    expect(screen.getByText(/Day 1 — Tokyo/)).toBeInTheDocument();
    expect(screen.getByText("Senso-ji")).toBeInTheDocument();
    expect(screen.getByText("Temple")).toBeInTheDocument();
    expect(screen.getAllByText("Must-do").length).toBeGreaterThan(0);
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Est. $25")).toBeInTheDocument();
  });

  it("fires the regenerate and cheaper handlers", () => {
    const onRegenerate = vi.fn();
    const onCheaper = vi.fn();
    render(<DayCard day={DAY1} onRegenerate={onRegenerate} onCheaper={onCheaper} />);
    fireEvent.click(screen.getByRole("button", { name: /regenerate this day/i }));
    fireEvent.click(screen.getByRole("button", { name: /make it cheaper/i }));
    expect(onRegenerate).toHaveBeenCalledWith(DAY1);
    expect(onCheaper).toHaveBeenCalledWith(DAY1);
  });
});

describe("ComplianceCard", () => {
  it("renders all review checks", () => {
    render(<ComplianceCard review={TRIP.review_result!} />);
    expect(screen.getByText("All checks passed")).toBeInTheDocument();
    expect(screen.getByText("Within budget")).toBeInTheDocument();
    expect(screen.getByText("Avoids crowds")).toBeInTheDocument();
  });
});

describe("BudgetCard", () => {
  it("renders total vs target and category amounts", () => {
    render(<BudgetCard budget={TRIP.budget_breakdown!} target={3000} />);
    expect(screen.getByText("$1,250 / $3,000")).toBeInTheDocument();
    expect(screen.getByText("Accommodation")).toBeInTheDocument();
    expect(screen.getByText("$560")).toBeInTheDocument();
  });
});

describe("LogisticsCard", () => {
  it("renders stays and the inter-city Shinkansen leg", () => {
    render(<LogisticsCard stays={TRIP.stay_recommendations!} legs={TRIP.logistics_legs!} />);
    expect(screen.getByText("Yanaka, Tokyo")).toBeInTheDocument();
    expect(screen.getByText("Shinkansen")).toBeInTheDocument();
  });
});

describe("PlanProgress", () => {
  it("reflects idle / active / done states from progress events", () => {
    const events: ProgressEvent[] = [
      { stage: "orchestrator", status: "started" },
      { stage: "destination", status: "started" },
      { stage: "logistics", status: "started" },
      { stage: "destination", status: "done" },
    ];
    render(<PlanProgress events={events} destination="Japan" />);
    expect(screen.getByTestId("agent-destination").getAttribute("data-status")).toBe("done");
    expect(screen.getByTestId("agent-logistics").getAttribute("data-status")).toBe("active");
    expect(screen.getByTestId("agent-budget").getAttribute("data-status")).toBe("idle");
    expect(screen.getByText(/Planning your Japan trip/)).toBeInTheDocument();
  });
});

describe("ItineraryView", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it("renders the header, day cards and the sticky sidebar cards", () => {
    renderItinerary(TRIP);
    expect(screen.getByRole("heading", { name: /Your Japan Journey/ })).toBeInTheDocument();
    expect(screen.getByText(/2 days · Tokyo & Kyoto/)).toBeInTheDocument();
    expect(screen.getByText("Senso-ji")).toBeInTheDocument();
    expect(screen.getByText("Fushimi Inari")).toBeInTheDocument();
    expect(screen.getByText("Trip Compliance")).toBeInTheDocument();
    expect(screen.getByText("Budget Breakdown")).toBeInTheDocument();
    expect(screen.getByText("Stay & Logistics")).toBeInTheDocument();
  });

  it("saves the trip to localStorage and confirms", () => {
    renderItinerary(TRIP);
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect(screen.getByRole("button", { name: /saved/i })).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem("voyageai:savedTrips") ?? "[]");
    expect(saved).toHaveLength(1);
    expect(saved[0].title).toBe("2 days in Japan");
  });

  it("shares a copied link", async () => {
    renderItinerary(TRIP);
    fireEvent.click(screen.getByRole("button", { name: /share/i }));
    expect(await screen.findByRole("status")).toHaveTextContent(/link/i);
  });

  it("regenerates a day via the API and patches it in", async () => {
    const newDay: ItineraryDay = {
      day: 1,
      city: "Tokyo",
      date_label: "Day 1",
      items: [
        { title: "Meiji Shrine (fresh pick)", description: "Calm forest shrine.", category: "temple", priority: "must-do", est_cost_usd: 0, time_block: "morning" },
      ],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ day: newDay }) }))
    );
    renderItinerary(TRIP);
    fireEvent.click(screen.getAllByRole("button", { name: /regenerate this day/i })[0]);
    expect(await screen.findByText("Meiji Shrine (fresh pick)")).toBeInTheDocument();
  });
});
