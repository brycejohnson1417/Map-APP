import { NextResponse } from "next/server";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import {
  mergePrintavoAutoSyncSettings,
  resolvePrintavoAutoSyncSettings,
} from "@/lib/application/fraternitees/printavo-auto-sync-settings";
import { resolveRouteParams } from "@/lib/presentation/route-params";
import { OrganizationRepository } from "@/lib/infrastructure/supabase/organization-repository";

const organizations = new OrganizationRepository();

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> | { slug: string } },
) {
  const { slug } = await resolveRouteParams(context.params);
  const sessionEmail = await getTenantSessionEmailForSlug(slug);
  if (!sessionEmail) {
    return NextResponse.json(
      { ok: false, error: "Tenant login is required to view Printavo automation settings." },
      { status: 401 },
    );
  }

  const organization = await organizations.findBySlug(slug);
  if (!organization) {
    return NextResponse.json({ ok: false, error: `Organization "${slug}" was not found.` }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    automation: resolvePrintavoAutoSyncSettings(organization.settings),
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> | { slug: string } },
) {
  const { slug } = await resolveRouteParams(context.params);
  const sessionEmail = await getTenantSessionEmailForSlug(slug);
  if (!sessionEmail) {
    return NextResponse.json(
      { ok: false, error: "Tenant login is required to update Printavo automation settings." },
      { status: 401 },
    );
  }

  const organization = await organizations.findBySlug(slug);
  if (!organization) {
    return NextResponse.json({ ok: false, error: `Organization "${slug}" was not found.` }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    enabled?: boolean;
    hourUtc?: number;
  };

  if (typeof body.enabled !== "boolean") {
    return NextResponse.json({ ok: false, error: "An enabled boolean is required." }, { status: 400 });
  }

  const updated = await organizations.updateSettings(
    organization.id,
    mergePrintavoAutoSyncSettings(organization.settings, {
      enabled: body.enabled,
      hourUtc: body.hourUtc,
    }),
  );

  return NextResponse.json({
    ok: true,
    automation: resolvePrintavoAutoSyncSettings(updated.settings),
  });
}
