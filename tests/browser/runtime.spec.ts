import { expect, test } from "@playwright/test";

test("core runtime pages load", async ({ page }) => {
  const orgSlug = process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG?.trim() || process.env.ORG_SLUG?.trim() || "fraternitees";

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /sign in to the right workspace/i })).toBeVisible();

  await page.goto(`/accounts?org=${encodeURIComponent(orgSlug)}`);
  await expect(page.getByRole("heading", { name: /accounts/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /comment a request/i })).toHaveCount(0);

  await page.goto(`/change-requests?org=${encodeURIComponent(orgSlug)}`);
  await expect(page).toHaveURL(new RegExp(`/login\\?org=${orgSlug}`));
  await expect(page.getByRole("heading", { name: /sign in to the right workspace/i })).toBeVisible();

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

test("authenticated tenant can enter comment mode and place a locked-page comment", async ({ page, context, baseURL }) => {
  const orgSlug = process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG?.trim() || process.env.ORG_SLUG?.trim() || "fraternitees";
  const base = new URL(baseURL ?? "https://map-app-supabase.vercel.app");

  await context.addCookies([
    {
      name: "tenant_session_email",
      value: "qa@fraternitees.com",
      domain: base.hostname,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    },
    {
      name: "tenant_session_slug",
      value: orgSlug,
      domain: base.hostname,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    },
    {
      name: "tenant_session_template",
      value: "fraternity-sales",
      domain: base.hostname,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    },
  ]);

  await page.goto(`/accounts?org=${encodeURIComponent(orgSlug)}`);
  await expect(page.getByRole("heading", { name: /accounts/i }).first()).toBeVisible();

  const openMapLink = page.getByRole("link", { name: /open map/i });
  const openMapBox = await openMapLink.boundingBox();
  if (!openMapBox) {
    throw new Error("Open map link is not visible for comment mode verification.");
  }

  await page.getByRole("button", { name: /^comment$/i }).click();
  await expect(page.getByText(/page is locked until you discard or submit this request/i)).toBeVisible();

  await page.mouse.click(openMapBox.x + openMapBox.width / 2, openMapBox.y + openMapBox.height / 2);
  await expect(page).toHaveURL(new RegExp(`/accounts\\?org=${orgSlug}`));
  await expect(page.getByPlaceholder(/add a comment about what should change here/i)).toBeVisible();

  await page.getByPlaceholder(/add a comment about what should change here/i).fill("Keep this button from navigating while comment mode is open.");
  await expect(page.getByRole("button", { name: /edit comment 1/i })).toBeVisible();

  await page.getByRole("button", { name: /discard/i }).click();
  await expect(page.getByText(/page is locked until you discard or submit this request/i)).toHaveCount(0);
});
