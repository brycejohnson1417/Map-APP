import { NextResponse } from "next/server";
import { getTerritoryOverlays } from "@/lib/application/runtime/territory-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";

export async function GET(_: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
  const overlays = await getTerritoryOverlays(slug);

  if (!overlays) {
    return NextResponse.json({ ok: false, error: "organization_not_found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      ok: true,
      boundaries: overlays.boundaries,
      markers: overlays.markers,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=10, stale-while-revalidate=45",
      },
    },
  );
}
