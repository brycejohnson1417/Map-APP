import { NextResponse } from "next/server";
import { resolvePrintavoAutoSyncSettings } from "@/lib/application/fraternitees/printavo-auto-sync-settings";
import { runPrintavoSync } from "@/lib/application/fraternitees/printavo-sync-service";
import { resolveTenantPluginSettings } from "@/lib/application/runtime/plugin-settings";
import { OrganizationRepository } from "@/lib/infrastructure/supabase/organization-repository";
import { compileWorkspaceDefinition } from "@/lib/platform/workspace/registry";

export const maxDuration = 60;

const organizations = new OrganizationRepository();

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized cron invocation." }, { status: 401 });
}

function authorizeCron(request: Request) {
  const configuredSecret = process.env.CRON_SECRET?.trim();
  if (configuredSecret) {
    return request.headers.get("authorization") === `Bearer ${configuredSecret}`;
  }

  return process.env.VERCEL_ENV !== "production";
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return unauthorized();
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "1";

  const activeOrganizations = await organizations.listActive(100);
  const eligibleOrganizations = activeOrganizations.filter((organization) => {
    const workspace = compileWorkspaceDefinition({ organization });
    if (!workspace.connectors.some((connector) => connector.provider === "printavo")) {
      return false;
    }
    if (!resolveTenantPluginSettings(organization.slug, organization.settings).printavoSync.enabled) {
      return false;
    }
    return resolvePrintavoAutoSyncSettings(organization.settings).enabled;
  });

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      eligibleOrganizations: eligibleOrganizations.map((organization) => organization.slug),
      count: eligibleOrganizations.length,
    });
  }

  const results: Array<{
    slug: string;
    ok: boolean;
    importedOrders?: number;
    importedAccounts?: number;
    error?: string;
  }> = [];

  for (const organization of eligibleOrganizations) {
    try {
      const result = await runPrintavoSync({
        organizationId: organization.id,
        organizationSlug: organization.slug,
        email: null,
        apiKey: null,
        mode: "latest",
        pageLimit: 3,
        pageSize: 25,
      });

      results.push({
        slug: organization.slug,
        ok: true,
        importedOrders: result.imported.upsertedOrders,
        importedAccounts: result.imported.accountsSeen,
      });
    } catch (error) {
      results.push({
        slug: organization.slug,
        ok: false,
        error: error instanceof Error ? error.message : "Printavo sync failed",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun: false,
    attempted: eligibleOrganizations.length,
    results,
  });
}
