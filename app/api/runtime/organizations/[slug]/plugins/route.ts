import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  PICC_SESSION_EMAIL_COOKIE,
  TENANT_SESSION_EMAIL_COOKIE,
  TENANT_SESSION_SLUG_COOKIE,
  resolveTenantAccess,
} from "@/lib/application/auth/tenant-access";
import { FRATERNITEES_SESSION_COOKIE, isFraterniteesEmail } from "@/lib/application/fraternitees/onboarding-service";
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
  const cookieStore = await cookies();
  const tenantEmail = cookieStore.get(TENANT_SESSION_EMAIL_COOKIE)?.value ?? "";
  const tenantSlug = cookieStore.get(TENANT_SESSION_SLUG_COOKIE)?.value ?? "";
  const directFraterniteesEmail = cookieStore.get(FRATERNITEES_SESSION_COOKIE)?.value ?? "";
  const directPiccEmail = cookieStore.get(PICC_SESSION_EMAIL_COOKIE)?.value ?? "";

  if (slug === "fraternitees") {
    return isFraterniteesEmail(directFraterniteesEmail) || (tenantSlug === slug && resolveTenantAccess(tenantEmail)?.slug === slug);
  }

  if (slug === "picc") {
    return resolveTenantAccess(directPiccEmail)?.slug === slug || (tenantSlug === slug && resolveTenantAccess(tenantEmail)?.slug === slug);
  }

  return tenantSlug === slug && resolveTenantAccess(tenantEmail)?.slug === slug;
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
