const baseUrl = process.env.SMOKE_BASE_URL?.trim();
const defaultOrgSlug = process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG?.trim() || process.env.ORG_SLUG?.trim();
const testTenantEmail = process.env.TEST_TENANT_EMAIL?.trim() || "qa@fraternitees.com";
const testTenantTemplate = process.env.TEST_TENANT_TEMPLATE_ID?.trim() || "fraternity-sales";

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

function tenantCookieHeader(orgSlug) {
  return [
    `tenant_session_email=${encodeURIComponent(testTenantEmail)}`,
    `tenant_session_slug=${encodeURIComponent(orgSlug)}`,
    `tenant_session_template=${encodeURIComponent(testTenantTemplate)}`,
  ].join("; ");
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
      await assertOk(`/accounts/${firstAccountId}?org=${defaultOrgSlug}`);
      await assertOk(`/api/runtime/organizations/${defaultOrgSlug}/accounts/${firstAccountId}`);
    }

    const changeRequestForm = new FormData();
    const requestTitle = `Smoke test request ${new Date().toISOString()}`;
    changeRequestForm.set("title", requestTitle);
    changeRequestForm.set("problem", "Verify that the tenant comment queue accepts a request.");
    changeRequestForm.set("requestedOutcome", "Queue the request successfully and return a JSON payload.");
    changeRequestForm.set("businessContext", "Smoke verification should catch queue regressions before production use.");
    changeRequestForm.set("acceptanceCriteria", "The request is created, listed, and deleted successfully.");
    changeRequestForm.set("currentUrl", new URL(`/accounts?org=${defaultOrgSlug}`, baseUrl).toString());
    changeRequestForm.set("surface", "accounts");
    changeRequestForm.set(
      "captureContext",
      JSON.stringify({
        capturedAt: new Date().toISOString(),
        viewport: {
          width: 1280,
          height: 720,
          scrollX: 0,
          scrollY: 0,
          devicePixelRatio: 2,
        },
        marker: {
          viewportX: 0.5,
          viewportY: 0.5,
          pageX: 0.5,
          pageY: 0.5,
        },
        target: null,
      }),
    );

    const changeRequestResponse = await fetch(
      new URL(`/api/runtime/organizations/${defaultOrgSlug}/change-requests`, baseUrl),
      {
        method: "POST",
        headers: {
          cookie: tenantCookieHeader(defaultOrgSlug),
        },
        body: changeRequestForm,
      },
    );

    if (changeRequestResponse.status !== 200) {
      const body = await changeRequestResponse.text();
      throw new Error(`Change request creation failed with ${changeRequestResponse.status}. Body: ${body.slice(0, 400)}`);
    }

    const changeRequestBody = await changeRequestResponse.json();
    if (!changeRequestBody.ok || !changeRequestBody.request?.id) {
      throw new Error("Change request creation did not return a request id.");
    }
    if (changeRequestBody.request.status !== "queued") {
      throw new Error(`Expected queued change request status, got ${changeRequestBody.request.status}`);
    }

    const deleteResponse = await fetch(
      new URL(`/api/runtime/organizations/${defaultOrgSlug}/change-requests/${changeRequestBody.request.id}`, baseUrl),
      {
        method: "DELETE",
        headers: {
          cookie: tenantCookieHeader(defaultOrgSlug),
        },
      },
    );
    if (deleteResponse.status !== 200) {
      const body = await deleteResponse.text();
      throw new Error(`Change request cleanup failed with ${deleteResponse.status}. Body: ${body.slice(0, 400)}`);
    }
  }

  console.log(`Smoke verification passed against ${baseUrl}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
