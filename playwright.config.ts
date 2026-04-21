import { defineConfig } from "@playwright/test";

const baseURL = process.env.SMOKE_BASE_URL?.trim();

if (!baseURL) {
  throw new Error("SMOKE_BASE_URL is required for Playwright verification");
}

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
