import { NextResponse } from "next/server";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import { duplicateSavedRoute } from "@/lib/application/runtime/saved-route-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string; routeId: string }> | { slug: string; routeId: string } },
) {
  const { slug, routeId } = await resolveRouteParams(context.params);
  const sessionEmail = await getTenantSessionEmailForSlug(slug);
  if (!sessionEmail) {
    return NextResponse.json({ ok: false, error: "Tenant login is required to duplicate saved routes." }, { status: 401 });
  }

  const route = await duplicateSavedRoute(slug, routeId, sessionEmail);
  if (!route) {
    return NextResponse.json({ ok: false, error: "route_not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, route }, { headers: { "Cache-Control": "no-store" } });
}
