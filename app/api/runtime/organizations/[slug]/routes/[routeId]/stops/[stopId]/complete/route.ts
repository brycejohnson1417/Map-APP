import { NextResponse } from "next/server";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import { completeSavedRouteStop } from "@/lib/application/runtime/saved-route-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string; routeId: string; stopId: string }> | { slug: string; routeId: string; stopId: string } },
) {
  const { slug, routeId, stopId } = await resolveRouteParams(context.params);
  const sessionEmail = await getTenantSessionEmailForSlug(slug);
  if (!sessionEmail) {
    return NextResponse.json({ ok: false, error: "Tenant login is required to complete route stops." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { note?: unknown };
  try {
    const route = await completeSavedRouteStop(slug, routeId, stopId, sessionEmail, typeof body.note === "string" ? body.note : null);
    if (!route) {
      return NextResponse.json({ ok: false, error: "route_stop_not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, route }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to complete route stop." },
      { status: 400 },
    );
  }
}
