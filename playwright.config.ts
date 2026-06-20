import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    // Locally, drive a system-installed Chromium browser (default "chrome") to
    // avoid Playwright's bundled-Chromium download, which fails to extract in some
    // Windows sandboxes (Defender locks the 252MB chrome.dll mid-extraction). In CI
    // the bundled build extracts fine, so use it there. Override with PW_CHANNEL.
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.PW_CHANNEL || (process.env.CI ? undefined : "chrome"),
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
