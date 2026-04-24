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

test("comment mode shows validation clearly and still submits when screenshot capture falls back", async ({
  page,
  context,
  baseURL,
}) => {
  const orgSlug = process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG?.trim() || process.env.ORG_SLUG?.trim() || "fraternitees";
  const base = new URL(baseURL ?? "https://map-app-supabase.vercel.app");

  await page.addInitScript(() => {
    const original = window.getComputedStyle.bind(window);
    window.getComputedStyle = ((element: Element, pseudoElt?: string | null) => {
      const style = original(element, pseudoElt ?? null);
      if (element === document.body) {
        return new Proxy(style, {
          get(target, prop, receiver) {
            if (prop === "backgroundColor") {
              return 'color(srgb 1 0 0)';
            }
            return Reflect.get(target, prop, receiver);
          },
        });
      }
      return style;
    }) as typeof window.getComputedStyle;
  });

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

  await page.route(`**/api/runtime/organizations/${orgSlug}/change-requests`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        request: {
          id: "mock-request-id",
          organizationId: "mock-org",
          requestedByEmail: "qa@fraternitees.com",
          title: "Mock request",
          currentUrl: `/accounts?org=${orgSlug}`,
          surface: "accounts",
          classification: "config",
          status: "new",
          problem: "Mock",
          requestedOutcome: "Mock",
          businessContext: null,
          acceptanceCriteria: null,
          classifierNotes: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          attachments: [],
        },
      }),
    });
  });

  await page.goto(`/accounts?org=${encodeURIComponent(orgSlug)}`);
  const openMapLink = page.getByRole("link", { name: /open map/i });
  const avgScoreCard = page.getByText(/avg score/i).first();
  const openMapBox = await openMapLink.boundingBox();
  const avgScoreBox = await avgScoreCard.boundingBox();
  if (!openMapBox) {
    throw new Error("Open map link is not visible for comment validation verification.");
  }
  if (!avgScoreBox) {
    throw new Error("Average score card is not visible for comment validation verification.");
  }

  await page.getByRole("button", { name: /^comment$/i }).click();
  await page.mouse.click(openMapBox.x + openMapBox.width / 2, openMapBox.y + openMapBox.height / 2);
  await page.getByPlaceholder(/add a comment about what should change here/i).fill("Comment one");

  await page.mouse.click(avgScoreBox.x + avgScoreBox.width / 2, avgScoreBox.y + avgScoreBox.height / 2);
  await page.getByRole("button", { name: /^submit$/i }).click();
  await expect(page.getByText(/every comment needs text before you submit/i).first()).toBeVisible();

  await page.getByRole("button", { name: /hide details/i }).click();
  await expect(page.getByText(/^2 comments$/)).toHaveCount(0);

  await page.getByPlaceholder(/add a comment about what should change here/i).fill("Comment two");
  await page.getByRole("button", { name: /^submit$/i }).click();
  await expect(page.getByText(/request added to the queue/i)).toBeVisible();
});
