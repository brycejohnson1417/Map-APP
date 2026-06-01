import { NextResponse } from "next/server";
import { findRuntimeOrganization } from "@/lib/application/runtime/runtime-rest";
import { resolveRouteParams } from "@/lib/presentation/route-params";

const DEFAULT_OSM_TILE_URL_TEMPLATE = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const DEFAULT_OSM_TILE_ATTRIBUTION = "&copy; OpenStreetMap contributors";

function readOpenStreetMapConfig(settings: Record<string, unknown>) {
  const mapSettings = typeof settings.map === "object" && settings.map !== null ? (settings.map as Record<string, unknown>) : {};
  const tileUrlTemplate =
    typeof mapSettings.tileUrlTemplate === "string" && mapSettings.tileUrlTemplate.trim()
      ? mapSettings.tileUrlTemplate.trim()
      : process.env.OPENSTREETMAP_TILE_URL_TEMPLATE?.trim() || DEFAULT_OSM_TILE_URL_TEMPLATE;
  const tileAttribution =
    typeof mapSettings.tileAttribution === "string" && mapSettings.tileAttribution.trim()
      ? mapSettings.tileAttribution.trim()
      : process.env.OPENSTREETMAP_TILE_ATTRIBUTION?.trim() || DEFAULT_OSM_TILE_ATTRIBUTION;

  return {
    tileUrlTemplate,
    tileAttribution,
  };
}

export async function GET(_: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
  const organization = await findRuntimeOrganization(slug);

  if (!organization) {
    return NextResponse.json({ ok: false, error: "organization_not_found" }, { status: 404 });
  }

  const openStreetMapConfig = readOpenStreetMapConfig(organization.settings);

  return NextResponse.json(
    {
      ok: true,
      mapProvider: "openstreetmap",
      browserApiKey: null,
      tileUrlTemplate: openStreetMapConfig.tileUrlTemplate,
      tileAttribution: openStreetMapConfig.tileAttribution,
      configured: true,
      upgraded: false,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=300, stale-while-revalidate=900",
      },
    },
  );
}
