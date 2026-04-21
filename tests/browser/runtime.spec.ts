import { expect, test } from "@playwright/test";

test("core runtime pages load", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Map App Harness")).toBeVisible();

  await page.goto("/architecture");
  await expect(page.getByRole("heading", { name: /architecture/i })).toBeVisible();

  await page.goto("/territory");
  await expect(page.getByRole("heading", { name: /runtime foundation preview/i })).toBeVisible();
});
