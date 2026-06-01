import { NextResponse } from "next/server";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import { createSavedRoute, listSavedRoutes, type SaveRouteInput } from "@/lib/application/runtime/saved-route-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";

function readJsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function readLocation(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  return {
    label: typeof record.label === "string" ? record.label : null,
    latitude: typeof record.latitude === "number" && Number.isFinite(record.latitude) ? record.latitude : null,
    longitude: typeof record.longitude === "number" && Number.isFinite(record.longitude) ? record.longitude : null,
  };
}

function readSaveInput(body: Record<string, unknown>): SaveRouteInput {
  return {
    name: typeof body.name === "string" ? body.name : "",
    description: typeof body.description === "string" ? body.description : null,
    accountIds: Array.isArray(body.accountIds) ? body.accountIds.map(String) : [],
    visibility: body.visibility === "organization" || body.visibility === "shared" || body.visibility === "private" ? body.visibility : "private",
    sharedWithEmails: Array.isArray(body.sharedWithEmails) ? body.sharedWithEmails.map(String) : [],
    start: readLocation(body.start),
    end: readLocation(body.end),
    sourceFilters: readJsonObject(body.sourceFilters),
  };
}

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
  const sessionEmail = await getTenantSessionEmailForSlug(slug);
  if (!sessionEmail) {
    return NextResponse.json({ ok: false, error: "Tenant login is required to view saved routes." }, { status: 401 });
  }

  const routes = await listSavedRoutes(slug, sessionEmail);
  if (!routes) {
    return NextResponse.json({ ok: false, error: "organization_not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, routes }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
  const sessionEmail = await getTenantSessionEmailForSlug(slug);
  if (!sessionEmail) {
    return NextResponse.json({ ok: false, error: "Tenant login is required to save routes." }, { status: 401 });
  }

  const body = readJsonObject(await request.json().catch(() => ({})));
  try {
    const route = await createSavedRoute(slug, readSaveInput(body), sessionEmail);
    if (!route) {
      return NextResponse.json({ ok: false, error: "organization_not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, route }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to save route." },
      { status: 400 },
    );
  }
}
