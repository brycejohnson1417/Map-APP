import { expect, test } from "@playwright/test";

function testTenantOrgSlug() {
  return process.env.TEST_TENANT_ORG_SLUG?.trim() || process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG?.trim() || process.env.ORG_SLUG?.trim() || "fraternitees";
}

function testTenantEmail() {
  return process.env.TEST_TENANT_EMAIL?.trim() || "qa@fraternitees.com";
}

function testTenantTemplate() {
  return process.env.TEST_TENANT_TEMPLATE_ID?.trim() || "fraternity-sales";
}

async function seedTenantSession({
  context,
  baseURL,
  orgSlug,
}: {
  context: Parameters<(typeof test)["extend"]>[0] extends never ? never : any;
  baseURL?: string;
  orgSlug: string;
}) {
  const base = new URL(baseURL ?? "https://map-app-supabase.vercel.app");
  const secure = base.protocol === "https:";

  await context.addCookies([
    {
      name: "tenant_session_email",
      value: testTenantEmail(),
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
      value: testTenantTemplate(),
      domain: base.hostname,
      path: "/",
      httpOnly: true,
      secure,
      sameSite: "Lax",
    },
  ]);
}

test("core runtime pages load", async ({ page, context, baseURL }) => {
  const orgSlug = testTenantOrgSlug();
  const base = new URL(baseURL ?? "https://map-app-supabase.vercel.app");

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /sign in to the right workspace/i })).toBeVisible();

  await page.goto(`/accounts?org=${encodeURIComponent(orgSlug)}`);
  await expect(page.getByRole("heading", { name: /accounts/i }).first()).toBeVisible();
  await expect(page.getByRole("tab", { name: /scoring engine/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /account leaderboard/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /comment a request/i })).toHaveCount(0);

  await page.goto(`/change-requests?org=${encodeURIComponent(orgSlug)}`);
  await expect(page).toHaveURL(new RegExp(`/login\\?org=${orgSlug}`));
  await expect(page.getByRole("heading", { name: /sign in to the right workspace/i })).toBeVisible();

  await page.goto("/architecture");
  await expect(page.getByRole("heading", { name: /local-first runtime/i })).toBeVisible();

  const territoryPage = await context.newPage();
  await territoryPage.goto(new URL(`/territory?org=${encodeURIComponent(orgSlug)}`, base).toString());
  await expect(territoryPage.getByRole("heading", { name: /field console/i })).toBeVisible();

  if (orgSlug) {
    const runtimePage = await context.newPage();
    await runtimePage.goto(new URL(`/runtime/${orgSlug}`, base).toString());
    await expect(runtimePage.getByRole("heading", { name: /recent sync jobs/i })).toBeVisible();
    await expect(runtimePage.getByRole("heading", { name: /recent audit events/i })).toBeVisible();
    await runtimePage.close();
  }

  await territoryPage.close();
});

test("accounts page separates scoring and leaderboard into tabs", async ({ page }) => {
  const orgSlug = testTenantOrgSlug();

  await page.goto(`/accounts?org=${encodeURIComponent(orgSlug)}`);
  await expect(page.getByRole("tab", { name: /scoring engine/i })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: /^scoring engine$/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /trailing 12-month spend/i })).toHaveCount(0);

  await page.getByRole("tab", { name: /account leaderboard/i }).click();
  await expect(page).toHaveURL(new RegExp(`/accounts\\?org=${orgSlug}.*view=leaderboard`));
  await expect(page.getByRole("tab", { name: /account leaderboard/i })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: /account leaderboard/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /trailing 12-month spend/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^scoring engine$/i })).toHaveCount(0);
});

test("authenticated tenant can enter comment mode and place a locked-page comment", async ({ page, context, baseURL }) => {
  const orgSlug = testTenantOrgSlug();
  await seedTenantSession({ context, baseURL, orgSlug });

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
  const orgSlug = testTenantOrgSlug();

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

  await seedTenantSession({ context, baseURL, orgSlug });

  let requestCount = 0;
  await page.route(`**/api/runtime/organizations/${orgSlug}/change-requests`, async (route) => {
    requestCount += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        request: {
          id: `mock-request-id-${requestCount}`,
          organizationId: "mock-org",
          requestedByEmail: "qa@fraternitees.com",
          title: "Mock request",
          currentUrl: `/accounts?org=${orgSlug}`,
          surface: "accounts",
          classification: "config",
          status: "queued",
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
  await expect(page.getByText(/requests added to the queue/i)).toBeVisible();
});

test.describe("mobile annotation mode", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps the page visible and uses compact comment controls on mobile", async ({ page, context, baseURL }) => {
    const orgSlug = testTenantOrgSlug();
    await seedTenantSession({ context, baseURL, orgSlug });

    await page.goto(`/accounts?org=${encodeURIComponent(orgSlug)}`);
    await page.getByRole("button", { name: /^comment$/i }).click();

    const heading = page.getByRole("heading", { name: /fraternitees accounts/i });
    await expect(heading).toBeVisible();
    await expect(page.getByText(/request details/i)).toHaveCount(0);

    const headingBox = await heading.boundingBox();
    if (!headingBox) {
      throw new Error("Mobile annotation test could not find the account heading box.");
    }

    await page.mouse.click(headingBox.x + headingBox.width * 0.7, headingBox.y + headingBox.height * 0.5);
    await expect(page.getByPlaceholder(/add a comment about what should change here/i)).toBeVisible();
    await expect(page.getByText(/add extra details after submit from the queue/i)).toBeVisible();
  });

  test("mobile territory uses a true single-mode view and keeps navigation accessible", async ({ page, context, baseURL }) => {
    const orgSlug = testTenantOrgSlug();
    await seedTenantSession({ context, baseURL, orgSlug });

  await page.goto(`/territory?org=${encodeURIComponent(orgSlug)}`);
  await expect(page.getByRole("button", { name: /open workspace navigation/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /field console/i })).toBeVisible();
  await expect(page.locator(".leaflet-container")).toHaveCount(0);

    const fieldConsoleButton = page.getByRole("button", { name: /field console/i });
    const firstRowButton = page.locator("[data-testid^='territory-pin-row-']").first();
    await expect(firstRowButton).toBeVisible();
    const fieldConsoleBox = await fieldConsoleButton.boundingBox();
    const firstRowBox = await firstRowButton.boundingBox();
    if (!fieldConsoleBox || !firstRowBox) {
      throw new Error("Mobile territory list-mode verification could not read button positions.");
    }
    expect(firstRowBox.y).toBeGreaterThan(fieldConsoleBox.y + fieldConsoleBox.height - 4);

    await firstRowButton.click();
    await expect(page.getByText(/selected account/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /open account/i })).toBeVisible();
    await page.getByRole("button", { name: /hide selected account details/i }).click();

    await page.getByRole("button", { name: /field console/i }).click();
    await expect(page.getByRole("button", { name: /^list$/i })).toBeVisible();
    await page.getByRole("button", { name: /^map$/i }).click();
    await expect(page.locator(".leaflet-container")).toHaveCount(1);
    await expect(page.locator(".leaflet-control-zoom")).toBeVisible();

    await page.waitForFunction(() => Boolean((window as any).__MAP_APP_TEST?.getFirstMappablePinId?.()));
    const clickPoint = await page.evaluate(() => {
      const hooks = (window as any).__MAP_APP_TEST;
      const pinId = hooks?.getFirstMappablePinId?.();
      return pinId ? hooks.getLeafletClickPointForPin(pinId) : null;
    });
    if (!clickPoint) {
      throw new Error("Mobile territory map test could not resolve a clickable pin point.");
    }

    await page.mouse.click(clickPoint.x, clickPoint.y);
    await expect(page.getByText(/selected account/i)).toBeVisible();
  });

  test("mobile comment submit still works when screenshot annotation fails", async ({ page, context, baseURL }) => {
    const orgSlug = testTenantOrgSlug();
    await seedTenantSession({ context, baseURL, orgSlug });

    await page.addInitScript(() => {
      const originalToBlob = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob = function patchedToBlob(...args: Parameters<typeof originalToBlob>) {
        throw new DOMException("The string did not match the expected pattern.");
      };
    });

    let requestCount = 0;
    await page.route(`**/api/runtime/organizations/${orgSlug}/change-requests`, async (route) => {
      requestCount += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          request: {
            id: `mobile-request-id-${requestCount}`,
            organizationId: "mock-org",
            requestedByEmail: "qa@fraternitees.com",
            title: "Mock request",
            currentUrl: `/accounts?org=${orgSlug}`,
            surface: "accounts",
            classification: "config",
            status: "queued",
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
    await page.getByRole("button", { name: /^comment$/i }).click();

    const moduleHeading = page.getByRole("heading", { name: /^scoring engine$/i });
    const moduleHeadingBox = await moduleHeading.boundingBox();
    if (!moduleHeadingBox) {
      throw new Error("Mobile submit fallback test could not find the scoring engine heading.");
    }

    await page.mouse.click(moduleHeadingBox.x + moduleHeadingBox.width * 0.7, moduleHeadingBox.y + moduleHeadingBox.height * 0.6);
    await page.getByPlaceholder(/add a comment about what should change here/i).fill("Mobile screenshot fallback should not block submit.");
    await page.getByRole("button", { name: /^submit$/i }).click();

    await expect(page.getByText(/request added to the queue|requests added to the queue/i)).toBeVisible();
    await expect(page.getByText(/without screenshots/i)).toBeVisible();
  });

  test("integrations surface shows daily printavo sync controls", async ({ page, context, baseURL }) => {
    const orgSlug = testTenantOrgSlug();
    await seedTenantSession({ context, baseURL, orgSlug });

    await page.goto(`/integrations?org=${encodeURIComponent(orgSlug)}`);
    await expect(page.getByText(/automatic daily sync/i)).toBeVisible();
    await expect(page.getByText(/saved Printavo credentials only/i)).toBeVisible();
  });
});
