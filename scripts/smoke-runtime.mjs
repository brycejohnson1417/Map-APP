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
    await assertOk(`/api/runtime/organizations/${defaultOrgSlug}`);
    await assertOk(`/api/runtime/organizations/${defaultOrgSlug}/sync-jobs`);
  }

  console.log(`Smoke verification passed against ${baseUrl}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
