import { NextResponse } from "next/server";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import {
  deleteSavedRoute,
  getSavedRoute,
  updateSavedRoute,
  type UpdateRouteInput,
} from "@/lib/application/runtime/saved-route-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";

function readJsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function readUpdateInput(body: Record<string, unknown>): UpdateRouteInput {
  return {
    name: typeof body.name === "string" ? body.name : undefined,
    description: typeof body.description === "string" ? body.description : undefined,
    visibility: body.visibility === "organization" || body.visibility === "shared" || body.visibility === "private" ? body.visibility : undefined,
    sharedWithEmails: Array.isArray(body.sharedWithEmails) ? body.sharedWithEmails.map(String) : undefined,
    status: body.status === "draft" || body.status === "active" || body.status === "completed" || body.status === "archived" ? body.status : undefined,
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string; routeId: string }> | { slug: string; routeId: string } },
) {
  const { slug, routeId } = await resolveRouteParams(context.params);
  const sessionEmail = await getTenantSessionEmailForSlug(slug);
  if (!sessionEmail) {
    return NextResponse.json({ ok: false, error: "Tenant login is required to view saved routes." }, { status: 401 });
  }

  const route = await getSavedRoute(slug, routeId, sessionEmail);
  if (!route) {
    return NextResponse.json({ ok: false, error: "route_not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, route }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string; routeId: string }> | { slug: string; routeId: string } },
) {
  const { slug, routeId } = await resolveRouteParams(context.params);
  const sessionEmail = await getTenantSessionEmailForSlug(slug);
  if (!sessionEmail) {
    return NextResponse.json({ ok: false, error: "Tenant login is required to update saved routes." }, { status: 401 });
  }

  const body = readJsonObject(await request.json().catch(() => ({})));
  try {
    const route = await updateSavedRoute(slug, routeId, readUpdateInput(body), sessionEmail);
    if (!route) {
      return NextResponse.json({ ok: false, error: "route_not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, route }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to update route." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ slug: string; routeId: string }> | { slug: string; routeId: string } },
) {
  const { slug, routeId } = await resolveRouteParams(context.params);
  const sessionEmail = await getTenantSessionEmailForSlug(slug);
  if (!sessionEmail) {
    return NextResponse.json({ ok: false, error: "Tenant login is required to delete saved routes." }, { status: 401 });
  }

  const deleted = await deleteSavedRoute(slug, routeId, sessionEmail);
  if (!deleted) {
    return NextResponse.json({ ok: false, error: "route_not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
