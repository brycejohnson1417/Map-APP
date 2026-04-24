import { NextResponse } from "next/server";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import {
  mergeTenantPluginSetting,
  resolveTenantPluginSettings,
  type TenantPluginKey,
} from "@/lib/application/runtime/plugin-settings";
import { resolveRouteParams } from "@/lib/presentation/route-params";
import { OrganizationRepository } from "@/lib/infrastructure/supabase/organization-repository";

const organizations = new OrganizationRepository();
const pluginKeys = new Set<TenantPluginKey>(["routePlanning", "printavoSync", "runtimeDiagnostics"]);

interface PluginsRouteContext {
  params: Promise<{ slug: string }> | { slug: string };
}

async function hasTenantAccess(slug: string) {
  return Boolean(await getTenantSessionEmailForSlug(slug));
}

export async function GET(_request: Request, context: PluginsRouteContext) {
  const { slug } = await resolveRouteParams(context.params);
  const organization = await organizations.findBySlug(slug);

  if (!organization) {
    return NextResponse.json({ ok: false, error: `Organization "${slug}" was not found.` }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    plugins: resolveTenantPluginSettings(organization.slug, organization.settings),
  });
}

export async function PATCH(request: Request, context: PluginsRouteContext) {
  const { slug } = await resolveRouteParams(context.params);
  if (!(await hasTenantAccess(slug))) {
    return NextResponse.json({ ok: false, error: "Tenant login is required to update plugins." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    plugin?: TenantPluginKey;
    enabled?: boolean;
  };

  if (!body.plugin || !pluginKeys.has(body.plugin) || typeof body.enabled !== "boolean") {
    return NextResponse.json({ ok: false, error: "A valid plugin and enabled boolean are required." }, { status: 400 });
  }

  const organization = await organizations.findBySlug(slug);
  if (!organization) {
    return NextResponse.json({ ok: false, error: `Organization "${slug}" was not found.` }, { status: 404 });
  }

  const updated = await organizations.updateSettings(
    organization.id,
    mergeTenantPluginSetting(organization.settings, body.plugin, body.enabled),
  );

  return NextResponse.json({
    ok: true,
    plugins: resolveTenantPluginSettings(updated.slug, updated.settings),
  });
}
