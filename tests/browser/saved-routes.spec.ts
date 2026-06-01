import { expect, test } from "@playwright/test";

function testTenantOrgSlug() {
  return process.env.TEST_TENANT_ORG_SLUG?.trim() || process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG?.trim() || process.env.ORG_SLUG?.trim() || "fraternitees";
}

function testTenantEmail() {
  return process.env.TEST_TENANT_EMAIL?.trim() || "qa@fraternitees.com";
}

async function seedTenantSession({ context, baseURL, orgSlug }: { context: any; baseURL?: string; orgSlug: string }) {
  const base = new URL(baseURL ?? "https://map-app-supabase.vercel.app");
  await context.addCookies([
    {
      name: "tenant_session_email",
      value: testTenantEmail(),
      domain: base.hostname,
      path: "/",
      httpOnly: true,
      secure: base.protocol === "https:",
      sameSite: "Lax",
    },
    {
      name: "tenant_session_slug",
      value: orgSlug,
      domain: base.hostname,
      path: "/",
      httpOnly: true,
      secure: base.protocol === "https:",
      sameSite: "Lax",
    },
  ]);
}

test("saved route call list can be loaded, edited, duplicated, and completed without real writes", async ({
  page,
  context,
  baseURL,
}) => {
  const orgSlug = testTenantOrgSlug();
  await seedTenantSession({ context, baseURL, orgSlug });

  const route = {
    id: "route-1",
    organizationId: "org-1",
    name: "Morning campus loop",
    description: "Hit priority accounts before lunch.",
    status: "active",
    visibility: "shared",
    ownerEmail: testTenantEmail(),
    sharedWithEmails: ["manager@example.com"],
    startLabel: null,
    startLatitude: null,
    startLongitude: null,
    endLabel: null,
    endLatitude: null,
    endLongitude: null,
    optimizationMode: "nearest_neighbor",
    sourceFilters: {},
    stats: {
      totalStops: 3,
      plannedStops: 2,
      completedStops: 0,
      reviewStops: 1,
      estimatedDistanceMiles: 18.4,
      estimatedDurationMinutes: 44,
    },
    stops: [
      {
        id: "stop-1",
        organizationId: "org-1",
        routePlanId: "route-1",
        accountId: "account-1",
        stopIndex: 1,
        status: "planned",
        accountName: "Alpha House",
        city: "New York",
        state: "NY",
        latitude: 40.72,
        longitude: -74,
        distanceFromPreviousMiles: null,
        estimatedDurationFromPreviousMinutes: null,
        notes: null,
        completedAt: null,
        completionActivityId: null,
        createdAt: "2026-05-30T12:00:00.000Z",
        updatedAt: "2026-05-30T12:00:00.000Z",
      },
      {
        id: "stop-2",
        organizationId: "org-1",
        routePlanId: "route-1",
        accountId: "account-2",
        stopIndex: 2,
        status: "planned",
        accountName: "Beta House",
        city: "Brooklyn",
        state: "NY",
        latitude: 40.68,
        longitude: -73.94,
        distanceFromPreviousMiles: 4.2,
        estimatedDurationFromPreviousMinutes: 9,
        notes: null,
        completedAt: null,
        completionActivityId: null,
        createdAt: "2026-05-30T12:00:00.000Z",
        updatedAt: "2026-05-30T12:00:00.000Z",
      },
      {
        id: "stop-3",
        organizationId: "org-1",
        routePlanId: "route-1",
        accountId: "account-3",
        stopIndex: 3,
        status: "needs_review",
        accountName: "Missing Coordinates House",
        city: "Queens",
        state: "NY",
        latitude: null,
        longitude: null,
        distanceFromPreviousMiles: null,
        estimatedDurationFromPreviousMinutes: null,
        notes: null,
        completedAt: null,
        completionActivityId: null,
        createdAt: "2026-05-30T12:00:00.000Z",
        updatedAt: "2026-05-30T12:00:00.000Z",
      },
    ],
    createdAt: "2026-05-30T12:00:00.000Z",
    updatedAt: "2026-05-30T12:00:00.000Z",
  };
  const completedRoute = {
    ...route,
    stats: { ...route.stats, completedStops: 1, plannedStops: 1 },
    stops: route.stops.map((stop) =>
      stop.id === "stop-1"
        ? { ...stop, status: "completed", completedAt: "2026-05-30T13:00:00.000Z", completionActivityId: "activity-1" }
        : stop,
    ),
  };

  await page.route(`**/api/runtime/organizations/${orgSlug}/routes`, async (requestRoute) => {
    if (requestRoute.request().method() === "GET") {
      await requestRoute.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, routes: [route] }) });
      return;
    }
    await requestRoute.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, route }) });
  });
  await page.route(`**/api/runtime/organizations/${orgSlug}/routes/route-1`, async (requestRoute) => {
    const method = requestRoute.request().method();
    if (method === "DELETE") {
      await requestRoute.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
      return;
    }
    await requestRoute.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, route }) });
  });
  await page.route(`**/api/runtime/organizations/${orgSlug}/routes/route-1/duplicate`, async (requestRoute) => {
    await requestRoute.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, route: { ...route, id: "route-copy", name: "Morning campus loop copy" } }),
    });
  });
  await page.route(`**/api/runtime/organizations/${orgSlug}/routes/route-1/stops/stop-1/complete`, async (requestRoute) => {
    await requestRoute.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, route: completedRoute }) });
  });

  await page.goto(`/routes?org=${encodeURIComponent(orgSlug)}`);
  await page.getByRole("button", { name: /refresh/i }).click();
  await expect(page.getByRole("heading", { name: /saved routes/i })).toBeVisible();
  await expect(page.getByText(/morning campus loop/i).first()).toBeVisible();
  await expect(page.getByText(/coordinate review bucket/i)).toBeVisible();

  await page.getByLabel(/name/i).fill("Morning campus route");
  await expect(page.getByText(/unsaved/i)).toBeVisible();
  await page.getByRole("button", { name: /save changes/i }).click();
  await expect(page.getByText(/route saved/i)).toBeVisible();

  await page.getByRole("button", { name: /duplicate/i }).click();
  await expect(page.getByText(/route duplicated/i)).toBeVisible();

  await page.getByPlaceholder(/optional completion note/i).first().fill("Dropped catalog.");
  await page.getByRole("button", { name: /complete stop/i }).first().click();
  await expect(page.getByText(/stop completed and account activity was recorded/i)).toBeVisible();

  await page.getByRole("button", { name: /delete/i }).click();
  await expect(page.getByText(/delete this saved route/i)).toBeVisible();
  await page.getByRole("button", { name: /cancel/i }).click();
});
