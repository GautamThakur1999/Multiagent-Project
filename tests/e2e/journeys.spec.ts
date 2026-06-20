import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const JAPAN_CONSTRAINTS = {
  destination: "Japan", duration_days: 5, cities: ["Tokyo", "Kyoto"], budget_usd: 3000, currency: "USD",
  preferences: ["food", "temples"], avoidances: ["crowds"], travelers: 1, pace: "moderate", clarifications_needed: [],
};

const TRIP_STATE = {
  constraints: JAPAN_CONSTRAINTS,
  stay_recommendations: [
    { city: "Tokyo", neighborhood: "Yanaka", rationale: "Quiet.", price_range_usd_per_night: { min: 80, max: 150 }, nights: 2 },
    { city: "Kyoto", neighborhood: "Ohara", rationale: "Quiet.", price_range_usd_per_night: { min: 90, max: 170 }, nights: 2 },
  ],
  logistics_legs: [{ from: "Tokyo", to: "Kyoto", mode: "Shinkansen", duration_minutes: 135, est_cost_usd: 95, leg_type: "inter-city" }],
  budget_breakdown: { stay_usd: 560, transport_usd: 190, food_usd: 400, activities_usd: 100, total_usd: 1250, within_budget: true },
  final_itinerary: [
    { day: 1, city: "Tokyo", date_label: "Day 1", items: [{ title: "Senso-ji Temple", description: "Old temple.", category: "temple", priority: "must-do", est_cost_usd: 0, time_block: "morning", tips: "Dawn." }] },
    { day: 2, city: "Kyoto", date_label: "Day 2", items: [{ title: "Fushimi Inari", description: "Torii.", category: "temple", priority: "must-do", est_cost_usd: 0, time_block: "morning" }] },
  ],
  review_result: { overall: "pass", checks: [{ check: "within_budget", status: "pass", reason: "ok" }, { check: "fits_duration", status: "pass", reason: "ok" }] },
  has_caveats: false, caveats: [], replan_count: 0,
};

const FAIL_STATE = {
  ...TRIP_STATE,
  budget_breakdown: { stay_usd: 2400, transport_usd: 600, food_usd: 900, activities_usd: 300, total_usd: 4200, within_budget: false, overspend_usd: 1200, cheaper_alternatives: ["Stay in Asakusa instead of central Tokyo"] },
  review_result: { overall: "fail", checks: [{ check: "within_budget", status: "fail", reason: "Estimated $4,200 of $3,000.", suggested_fix: "Choose cheaper stays." }] },
  has_caveats: true, caveats: ["Budget exceeded."],
};

function encode(state: unknown): string {
  return Buffer.from(JSON.stringify(state), "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function sse(state: unknown): string {
  return [
    'event: progress\ndata: {"stage":"orchestrator","status":"started"}\n\n',
    'event: progress\ndata: {"stage":"orchestrator","status":"done"}\n\n',
    `event: itinerary\ndata: ${JSON.stringify(state)}\n\n`,
  ].join("");
}

async function buildPlan(page: import("@playwright/test").Page, planBody: string) {
  await page.route("**/api/parse", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "complete", constraints: JAPAN_CONSTRAINTS }) }));
  await page.route("**/api/plan", (r) => r.fulfill({ status: 200, contentType: "text/event-stream", body: planBody }));
  await page.goto("/");
  await page.getByPlaceholder(/Plan a 5-day trip to Japan/i).fill("Plan a 5-day trip to Japan, Tokyo + Kyoto, $3000, food and temples.");
  await page.getByRole("button", { name: /Plan my trip/i }).click();
  await page.getByRole("button", { name: /build my plan/i }).click();
}

test("infeasible plan routes to the adjustment screen with suggestions", async ({ page }) => {
  await buildPlan(page, sse(FAIL_STATE));
  await expect(page.getByText(/Let's refine your Japan plan/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /raise budget/i })).toBeVisible();
  // can still reveal the best-effort plan
  await page.getByRole("button", { name: /best-effort plan anyway/i }).click();
  await expect(page.getByRole("heading", { name: /Your Japan Journey/i })).toBeVisible();
});

test("edit path: regenerate a day updates the itinerary via API", async ({ page }) => {
  await page.route("**/api/regenerate-day", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ day: { day: 1, city: "Tokyo", date_label: "Day 1", items: [{ title: "Regenerated Highlight", description: "Fresh pick.", category: "experience", priority: "must-do", est_cost_usd: 10, time_block: "morning" }] } }) })
  );
  await page.goto(`/plan?shared=${encode(TRIP_STATE)}`);
  await expect(page.getByText("Senso-ji Temple")).toBeVisible();
  await page.getByRole("button", { name: /regenerate this day/i }).first().click();
  await expect(page.getByText("Regenerated Highlight")).toBeVisible();
});

test("edit path: make it cheaper re-plans via API", async ({ page }) => {
  const cheaper = { ...TRIP_STATE, budget_breakdown: { ...TRIP_STATE.budget_breakdown, total_usd: 920 } };
  await page.route("**/api/cheaper", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ state: cheaper }) }));
  await page.goto(`/plan?shared=${encode(TRIP_STATE)}`);
  await expect(page.getByText("$1,250 / $3,000")).toBeVisible();
  await page.getByRole("button", { name: /make it cheaper/i }).first().click();
  await expect(page.getByText("$920 / $3,000")).toBeVisible();
});

test("save → my trips → view round-trip", async ({ page }) => {
  await page.goto(`/plan?shared=${encode(TRIP_STATE)}`);
  await page.getByRole("button", { name: /^save$/i }).click();
  await page.goto("/trips");
  await expect(page.getByText("5 days in Japan")).toBeVisible();
  await page.getByRole("link", { name: /view itinerary/i }).click();
  await expect(page.getByRole("heading", { name: /Your Japan Journey/i })).toBeVisible();
});

test("shared link renders the itinerary directly", async ({ page }) => {
  await page.goto(`/plan?shared=${encode(TRIP_STATE)}`);
  await expect(page.getByRole("heading", { name: /Your Japan Journey/i })).toBeVisible();
  await expect(page.getByText("Senso-ji Temple")).toBeVisible();
});

test("no critical/serious a11y violations on key screens (contrast excluded — design tokens)", async ({ page }) => {
  const scan = async (url: string) => {
    await page.goto(url);
    const results = await new AxeBuilder({ page }).analyze();
    return results.violations.filter(
      (v) => (v.impact === "critical" || v.impact === "serious") && v.id !== "color-contrast"
    );
  };
  expect((await scan("/")).map((v) => v.id)).toEqual([]);
  expect((await scan("/trips")).map((v) => v.id)).toEqual([]);
  expect((await scan(`/plan?shared=${encode(TRIP_STATE)}`)).map((v) => v.id)).toEqual([]);
});
