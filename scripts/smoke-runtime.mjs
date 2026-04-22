const baseUrl = process.env.SMOKE_BASE_URL?.trim();
const defaultOrgSlug = process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG?.trim() || process.env.ORG_SLUG?.trim();

if (!baseUrl) {
  throw new Error("SMOKE_BASE_URL is required");
}

async function assertOk(pathname, expectedStatus = 200) {
  const url = new URL(pathname, baseUrl);
  const response = await fetch(url, {
    headers: {
      "cache-control": "no-store",
    },
  });

  if (response.status !== expectedStatus) {
    const body = await response.text();
    throw new Error(`Request to ${url} returned ${response.status}. Body: ${body.slice(0, 400)}`);
  }

  return response;
}

async function main() {
  await assertOk("/");
  await assertOk("/architecture");
  await assertOk("/territory");
  await assertOk("/api/runtime/health");

  if (defaultOrgSlug) {
    await assertOk(`/runtime/${defaultOrgSlug}`);
    const organizationResponse = await assertOk(`/api/runtime/organizations/${defaultOrgSlug}`);
    const organizationBody = await organizationResponse.json();
    if (!Array.isArray(organizationBody.snapshot?.recentAuditEvents)) {
      throw new Error("Runtime organization snapshot did not include recentAuditEvents");
    }
    if (!Array.isArray(organizationBody.snapshot?.syncJobStatusCounts)) {
      throw new Error("Runtime organization snapshot did not include syncJobStatusCounts");
    }

    const syncJobsResponse = await assertOk(`/api/runtime/organizations/${defaultOrgSlug}/sync-jobs`);
    const syncJobsBody = await syncJobsResponse.json();
    if (!Array.isArray(syncJobsBody.statusCounts)) {
      throw new Error("Sync jobs response did not include statusCounts");
    }
    await assertOk(`/api/runtime/organizations/${defaultOrgSlug}/territory/pins`);
    await assertOk(`/api/runtime/organizations/${defaultOrgSlug}/territory/overlays`);
    await assertOk(`/api/runtime/organizations/${defaultOrgSlug}/territory/map-config`);
    await assertOk(`/api/runtime/organizations/${defaultOrgSlug}/territory/pins?flag=missing_referral_source`);
    await assertOk(`/api/runtime/organizations/${defaultOrgSlug}/territory/pins?flag=missing_sample_delivery`);

    const pinsResponse = await assertOk(`/api/runtime/organizations/${defaultOrgSlug}/territory/pins`);
    const pinsBody = await pinsResponse.json();
    const firstAccountId = Array.isArray(pinsBody.pins) ? pinsBody.pins[0]?.id : null;
    if (firstAccountId) {
      await assertOk(`/accounts/${firstAccountId}`);
      await assertOk(`/api/runtime/organizations/${defaultOrgSlug}/accounts/${firstAccountId}`);
    }
  }

  console.log(`Smoke verification passed against ${baseUrl}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
