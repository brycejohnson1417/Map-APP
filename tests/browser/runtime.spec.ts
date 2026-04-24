import { expect, test } from "@playwright/test";

test("core runtime pages load", async ({ page }) => {
  const orgSlug = process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG?.trim() || process.env.ORG_SLUG?.trim() || "fraternitees";

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /sign in to the right workspace/i })).toBeVisible();

  await page.goto(`/accounts?org=${encodeURIComponent(orgSlug)}`);
  await expect(page.getByRole("heading", { name: /accounts/i }).first()).toBeVisible();

  await page.goto("/architecture");
  await expect(page.getByRole("heading", { name: /local-first runtime/i })).toBeVisible();

  await page.goto(`/territory?org=${encodeURIComponent(orgSlug)}`);
  await expect(page.getByRole("heading", { name: /field console/i })).toBeVisible();

  if (orgSlug) {
    await page.goto(`/runtime/${orgSlug}`);
    await expect(page.getByRole("heading", { name: /recent sync jobs/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /recent audit events/i })).toBeVisible();
  }
});
