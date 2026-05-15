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

test("tenant login routes to Rep Today", async ({ page }) => {
  await page.goto("/login?org=fraternitees");
  await page.getByPlaceholder("name@company.com").fill("qa@fraternitees.com");
  await page.getByRole("button", { name: /continue/i }).click();

  await page.waitForURL(/\/today\?org=fraternitees/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: /rep today/i })).toBeVisible();
});

test("Rep Today shows concrete work actions for data-backed tenants", async ({ page, context, baseURL }) => {
  await seedTenantSession({
    context,
    baseURL,
    orgSlug: "fraternitees",
    email: "qa@fraternitees.com",
    template: "fraternity-sales",
  });

  await page.goto("/today?org=fraternitees");

  await expect(page.getByRole("heading", { name: /rep today/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /work reorders/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /review opportunities/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open route mode", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /fix missing data/i })).toBeVisible();
});

test("Rep Today routes empty tenants to Connection Hub", async ({ page, context, baseURL }) => {
  await seedTenantSession({
    context,
    baseURL,
    orgSlug: "dynalites",
    email: "qa@dynalites.com",
    template: "dynalites-field-ops",
  });

  await page.goto("/today?org=dynalites");

  await expect(page.getByRole("heading", { name: /connect data before working today/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /import first account data/i })).toHaveAttribute("href", "/integrations?org=dynalites");
});
