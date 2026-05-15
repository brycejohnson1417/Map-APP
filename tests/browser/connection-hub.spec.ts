import { expect, test, type BrowserContext } from "@playwright/test";

async function seedTenantSession({
  context,
  baseURL,
  orgSlug,
  email,
  template,
}: {
  context: BrowserContext;
  baseURL?: string;
  orgSlug: string;
  email: string;
  template: string;
}) {
  const base = new URL(baseURL ?? "https://map-app-supabase.vercel.app");
  const secure = base.protocol === "https:";

  await context.addCookies([
    {
      name: "tenant_session_email",
      value: email,
      domain: base.hostname,
      path: "/",
      httpOnly: true,
      secure,
      sameSite: "Lax",
    },
    {
      name: "tenant_session_slug",
      value: orgSlug,
      domain: base.hostname,
      path: "/",
      httpOnly: true,
      secure,
      sameSite: "Lax",
    },
    {
      name: "tenant_session_template",
      value: template,
      domain: base.hostname,
      path: "/",
      httpOnly: true,
      secure,
      sameSite: "Lax",
    },
  ]);
}

test("empty tenant can preview and validate CSV account import from Connection Hub", async ({ page, context, baseURL }) => {
  await seedTenantSession({
    context,
    baseURL,
    orgSlug: "dynalites",
    email: "qa@dynalites.com",
    template: "dynalites-field-ops",
  });

  await page.goto("/integrations?org=dynalites");

  await expect(page.getByRole("heading", { name: /connection hub/i })).toBeVisible();
  await expect(page.getByText(/import first account data/i)).toBeVisible();

  await page.getByLabel(/paste csv rows/i).fill(`Company,Street,City,State,Postal Code,Owner,Status
DynaLites Albany,10 Market St,Albany,NY,12207,Avery,Prospect
,No Company Ave,Troy,NY,12180,,`);
  await page.getByRole("button", { name: /preview import/i }).click();

  await expect(page.getByText(/2 rows parsed/i)).toBeVisible();
  await expect(page.getByText("Company name", { exact: true })).toBeVisible();
  await expect(page.getByText("DynaLites Albany", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /import 1 account/i })).toBeVisible();
});

test("empty tenant account and territory views route users back to Connection Hub", async ({ page, context, baseURL }) => {
  await seedTenantSession({
    context,
    baseURL,
    orgSlug: "dynalites",
    email: "qa@dynalites.com",
    template: "dynalites-field-ops",
  });

  await page.goto("/accounts?org=dynalites");

  await expect(page.getByRole("heading", { name: /import accounts before working this tenant/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /import first account data/i })).toHaveAttribute("href", "/integrations?org=dynalites");

  await page.goto("/territory?org=dynalites");

  await expect(page.getByRole("heading", { name: /import accounts before opening the map/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /import first account data/i })).toHaveAttribute("href", "/integrations?org=dynalites");
});
