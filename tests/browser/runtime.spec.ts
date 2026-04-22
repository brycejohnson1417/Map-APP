import { expect, test } from "@playwright/test";

test("core runtime pages load", async ({ page }) => {
  const orgSlug = process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG?.trim() || process.env.ORG_SLUG?.trim();

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /field console/i })).toBeVisible();

  await page.goto("/accounts");
  await expect(page.getByRole("heading", { name: "Accounts", exact: true })).toBeVisible();

  await page.goto("/architecture");
  await expect(page.getByRole("heading", { name: /local-first runtime/i })).toBeVisible();

  await page.goto("/territory");
  await expect(page.getByRole("heading", { name: /field console/i })).toBeVisible();

  if (orgSlug) {
    await page.goto(`/runtime/${orgSlug}`);
    await expect(page.getByRole("heading", { name: /recent sync jobs/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /recent audit events/i })).toBeVisible();
  }
});
