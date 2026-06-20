import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { StayLogistics } from "@/components/StayLogistics";
import { RequestAdjustment } from "@/components/RequestAdjustment";
import type { TripState } from "@/lib/types";

afterEach(cleanup);

const BASE: TripState = {
  constraints: {
    destination: "Japan", duration_days: 5, cities: ["Tokyo", "Kyoto"], budget_usd: 3000, currency: "USD",
    preferences: ["food", "temples"], avoidances: ["crowds"], travelers: 1, pace: "moderate", clarifications_needed: [],
  },
  stay_recommendations: [
    { city: "Tokyo", neighborhood: "Yanaka", rationale: "Quiet old-town.", price_range_usd_per_night: { min: 80, max: 150 }, nights: 2 },
    { city: "Kyoto", neighborhood: "Ohara", rationale: "Rural and calm.", price_range_usd_per_night: { min: 90, max: 170 }, nights: 2 },
  ],
  logistics_legs: [{ from: "Tokyo", to: "Kyoto", mode: "Shinkansen", duration_minutes: 135, est_cost_usd: 95, leg_type: "inter-city" }],
  final_itinerary: [],
  has_caveats: false,
  caveats: [],
  replan_count: 0,
};

describe("StayLogistics", () => {
  it("renders neighborhood cards grouped by city", () => {
    render(<StayLogistics state={BASE} />);
    expect(screen.getByText("Where to Stay")).toBeInTheDocument();
    expect(screen.getByText("Tokyo Neighborhoods")).toBeInTheDocument();
    expect(screen.getByText("Yanaka")).toBeInTheDocument();
    expect(screen.getByText("Ohara")).toBeInTheDocument();
    expect(screen.getByText("Quiet old-town.")).toBeInTheDocument();
  });

  it("renders the Shinkansen card with an external Book deep-link (no transaction)", () => {
    render(<StayLogistics state={BASE} />);
    const book = screen.getByRole("link", { name: /book/i });
    expect(book.getAttribute("target")).toBe("_blank");
    expect(book.getAttribute("href")).toMatch(/^https?:\/\//);
    expect(book.getAttribute("href")).toMatch(/Shinkansen/i);
  });
});

describe("RequestAdjustment", () => {
  const failing: TripState = {
    ...BASE,
    budget_breakdown: { stay_usd: 2000, transport_usd: 600, food_usd: 700, activities_usd: 200, total_usd: 3500, within_budget: false, overspend_usd: 500, cheaper_alternatives: ["Stay in Asakusa instead of central Tokyo"] },
    review_result: { overall: "fail", checks: [{ check: "within_budget", status: "fail", reason: "Estimated $3,500 of $3,000.", suggested_fix: "Choose cheaper stays." }] },
    has_caveats: true,
    caveats: ["Budget exceeded."],
  };

  it("renders the refine hero, failed check and suggestions", () => {
    render(
      <RequestAdjustment state={failing} onEditConstraints={() => {}} onShowAnyway={() => {}} />
    );
    expect(screen.getByText(/Let's refine your Japan plan/)).toBeInTheDocument();
    expect(screen.getByText(/Estimated \$3,500 of \$3,000/)).toBeInTheDocument();
    expect(screen.getByText(/Stay in Asakusa/)).toBeInTheDocument();
  });

  it("fires the suggestion callbacks", () => {
    const onEditConstraints = vi.fn();
    const onIncreaseBudget = vi.fn();
    const onShowAnyway = vi.fn();
    render(
      <RequestAdjustment
        state={failing}
        onEditConstraints={onEditConstraints}
        onIncreaseBudget={onIncreaseBudget}
        onShowAnyway={onShowAnyway}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /raise budget to \$3,500/i }));
    fireEvent.click(screen.getByRole("button", { name: /edit my trip details/i }));
    fireEvent.click(screen.getByRole("button", { name: /best-effort plan anyway/i }));
    expect(onIncreaseBudget).toHaveBeenCalledWith(3500);
    expect(onEditConstraints).toHaveBeenCalledOnce();
    expect(onShowAnyway).toHaveBeenCalledOnce();
  });
});
