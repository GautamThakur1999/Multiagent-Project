import { test, expect } from "@playwright/test";

/**
 * Sprint 1 smoke test — the dev server boots and the placeholder page renders
 * with the design-token badge. Real screen E2E tests arrive in Sprint 7+.
 */
test("home page renders with design tokens", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("token-badge")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "AI Travel Planner" }),
  ).toBeVisible();
});
