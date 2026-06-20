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
