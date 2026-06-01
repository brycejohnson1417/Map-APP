const baseUrl = process.env.SMOKE_BASE_URL?.trim();
const activeOrgSlug = process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG?.trim() || process.env.ORG_SLUG?.trim();
const testTenantEmail = process.env.TEST_TENANT_EMAIL?.trim() || "qa@fraternitees.com";
const testTenantTemplate = process.env.TEST_TENANT_TEMPLATE_ID?.trim() || "fraternity-sales";

if (!baseUrl) {
  throw new Error("SMOKE_BASE_URL is required");
}

if (!activeOrgSlug) {
  throw new Error("NEXT_PUBLIC_DEFAULT_ORG_SLUG or ORG_SLUG is required");
}

const fallbackCrossTenantSlug = activeOrgSlug === "picc" ? "fraternitees" : "picc";
const crossTenantSlug = process.env.SMOKE_CROSS_TENANT_SLUG?.trim() || fallbackCrossTenantSlug;

function tenantCookieHeader(orgSlug) {
  return [
    `tenant_session_email=${encodeURIComponent(testTenantEmail)}`,
    `tenant_session_slug=${encodeURIComponent(orgSlug)}`,
    `tenant_session_template=${encodeURIComponent(testTenantTemplate)}`,
  ].join("; ");
}

async function fetchRuntime(pathname, options = {}) {
  const response = await fetch(new URL(pathname, baseUrl), {
    ...options,
    headers: {
      "cache-control": "no-store",
      ...options.headers,
    },
  });
  return response;
}

async function assertDenied(pathname, options = {}) {
  const response = await fetchRuntime(pathname, options);
  if (![401, 403].includes(response.status)) {
    const body = await response.text();
    throw new Error(`Expected ${pathname} to deny access, got ${response.status}. Body: ${body.slice(0, 400)}`);
  }
}

async function assertAllowed(pathname) {
  const response = await fetchRuntime(pathname, {
    headers: {
      cookie: tenantCookieHeader(activeOrgSlug),
    },
  });

  if (response.status !== 200) {
    const body = await response.text();
    throw new Error(`Expected ${pathname} to allow active tenant access, got ${response.status}. Body: ${body.slice(0, 400)}`);
  }

  const body = await response.json();
  if (body.ok !== true) {
    throw new Error(`Expected ${pathname} to return ok=true for active tenant access.`);
  }
  return body;
}

async function main() {
  const representativeRoutes = [
    `/api/runtime/organizations/${activeOrgSlug}`,
    `/api/runtime/organizations/${activeOrgSlug}/sync-jobs`,
    `/api/runtime/organizations/${activeOrgSlug}/territory/pins`,
    `/api/runtime/organizations/${activeOrgSlug}/territory/overlays`,
    `/api/runtime/organizations/${activeOrgSlug}/territory/map-config`,
  ];

  for (const pathname of representativeRoutes) {
    await assertDenied(pathname);
    await assertAllowed(pathname);
  }

  await assertDenied(`/api/runtime/organizations/${crossTenantSlug}/territory/pins`, {
    headers: {
      cookie: tenantCookieHeader(activeOrgSlug),
    },
  });

  console.log(`Runtime auth smoke verification passed against ${baseUrl}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
