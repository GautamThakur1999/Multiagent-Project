import { test, expect } from "@playwright/test";

const JAPAN_CONSTRAINTS = {
  destination: "Japan",
  duration_days: 5,
  cities: ["Tokyo", "Kyoto"],
  budget_usd: 3000,
  currency: "USD",
  preferences: ["food", "temples"],
  avoidances: ["crowds"],
  travelers: 1,
  pace: "moderate",
  clarifications_needed: [],
};

test("landing page renders the hero and natural-language input", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /tailored by intelligence/i })).toBeVisible();
  await expect(page.getByPlaceholder(/Plan a 5-day trip to Japan/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Plan my trip/i })).toBeVisible();
});

test("landing → confirmation shows the parsed, editable constraints", async ({ page }) => {
  // Stub the API so the flow is deterministic and never hits live Gemini.
  await page.route("**/api/parse", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "complete", constraints: JAPAN_CONSTRAINTS }),
    });
  });

  await page.goto("/");
  await page
    .getByPlaceholder(/Plan a 5-day trip to Japan/i)
    .fill("Plan a 5-day trip to Japan. Tokyo + Kyoto. $3000. Food and temples, no crowds.");
  await page.getByRole("button", { name: /Plan my trip/i }).click();

  await expect(page).toHaveURL(/\/confirm/);
  await expect(page.getByText(/here's what I understood/i)).toBeVisible();
  await expect(page.getByLabel("Destination")).toHaveValue("Japan");
  await expect(page.getByText("Tokyo")).toBeVisible();
  await expect(page.getByText("Kyoto")).toBeVisible();
  await expect(page.getByRole("button", { name: /build my plan/i })).toBeVisible();
});

const TRIP_STATE = {
  constraints: JAPAN_CONSTRAINTS,
  stay_recommendations: [
    { city: "Tokyo", neighborhood: "Yanaka", rationale: "Quiet.", price_range_usd_per_night: { min: 80, max: 150 }, nights: 2 },
    { city: "Kyoto", neighborhood: "Ohara", rationale: "Quiet.", price_range_usd_per_night: { min: 90, max: 170 }, nights: 2 },
  ],
  logistics_legs: [
    { from: "Tokyo", to: "Kyoto", mode: "Shinkansen", duration_minutes: 135, est_cost_usd: 95, leg_type: "inter-city" },
  ],
  budget_breakdown: { stay_usd: 560, transport_usd: 190, food_usd: 400, activities_usd: 100, total_usd: 1250, within_budget: true },
  final_itinerary: [
    { day: 1, city: "Tokyo", date_label: "Day 1", items: [
      { title: "Senso-ji Temple", description: "Tokyo's oldest temple.", category: "temple", priority: "must-do", est_cost_usd: 0, time_block: "morning", tips: "Go at dawn." },
    ] },
    { day: 2, city: "Kyoto", date_label: "Day 2", items: [
      { title: "Shinkansen: Tokyo → Kyoto", description: "~2h15m.", category: "logistics", priority: "must-do", est_cost_usd: 95, time_block: "morning" },
    ] },
  ],
  review_result: { overall: "pass", checks: [
    { check: "fits_duration", status: "pass", reason: "ok" },
    { check: "within_budget", status: "pass", reason: "ok" },
  ] },
  has_caveats: false,
  caveats: [],
  replan_count: 0,
};

test("landing → plan → itinerary renders the streamed result", async ({ page }) => {
  await page.route("**/api/parse", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "complete", constraints: JAPAN_CONSTRAINTS }),
    });
  });
  await page.route("**/api/plan", async (route) => {
    const frames = [
      'event: progress\ndata: {"stage":"orchestrator","status":"started"}\n\n',
      'event: progress\ndata: {"stage":"destination","status":"done"}\n\n',
      'event: progress\ndata: {"stage":"logistics","status":"done"}\n\n',
      'event: progress\ndata: {"stage":"budget","status":"done"}\n\n',
      'event: progress\ndata: {"stage":"review","status":"done"}\n\n',
      'event: progress\ndata: {"stage":"orchestrator","status":"done"}\n\n',
      `event: itinerary\ndata: ${JSON.stringify(TRIP_STATE)}\n\n`,
    ];
    await route.fulfill({ status: 200, contentType: "text/event-stream", body: frames.join("") });
  });

  await page.goto("/");
  await page.getByPlaceholder(/Plan a 5-day trip to Japan/i).fill("Plan a 5-day trip to Japan, Tokyo + Kyoto, $3000, food and temples, no crowds.");
  await page.getByRole("button", { name: /Plan my trip/i }).click();
  await page.getByRole("button", { name: /build my plan/i }).click();

  await expect(page).toHaveURL(/\/plan/);
  await expect(page.getByRole("heading", { name: /Your Japan Journey/i })).toBeVisible();
  await expect(page.getByText("Senso-ji Temple")).toBeVisible();
  await expect(page.getByText("Trip Compliance")).toBeVisible();
  await expect(page.getByText("Budget Breakdown")).toBeVisible();
});

test("confirmation renders clarification questions when constraints are incomplete", async ({
  page,
}) => {
  await page.route("**/api/parse", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "needs_clarification",
        clarifications_needed: ["How many days will your trip be?"],
        partial: { destination: "Japan" },
      }),
    });
  });

  await page.goto("/");
  await page.getByPlaceholder(/Plan a 5-day trip to Japan/i).fill("Plan a trip to Japan");
  await page.getByRole("button", { name: /Plan my trip/i }).click();

  await expect(page.getByText("How many days will your trip be?")).toBeVisible();
});
