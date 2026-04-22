import { NextResponse } from "next/server";
import { findRuntimeOrganization, runtimeRestRequest } from "@/lib/application/runtime/runtime-rest";
import { resolveRouteParams } from "@/lib/presentation/route-params";

interface GoogleMapsIntegrationRow {
  config: Record<string, unknown> | null;
}

function readBrowserKeyFromConfig(config: Record<string, unknown> | null) {
  const browserApiKey = config?.browserApiKey;
  return typeof browserApiKey === "string" && browserApiKey.trim() ? browserApiKey.trim() : null;
}

export async function GET(_: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
  const organization = await findRuntimeOrganization(slug);

  if (!organization) {
    return NextResponse.json({ ok: false, error: "organization_not_found" }, { status: 404 });
  }

  const { data } = await runtimeRestRequest<GoogleMapsIntegrationRow[]>(
    "integration_installation",
    new URLSearchParams({
      organization_id: `eq.${organization.id}`,
      provider: "eq.google_maps",
      status: "eq.active",
      select: "config",
      order: "updated_at.desc",
      limit: "1",
    }),
  );

  const browserApiKey =
    readBrowserKeyFromConfig(data[0]?.config ?? null) ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_BROWSER_API_KEY?.trim() ||
    null;

  return NextResponse.json(
    {
      ok: true,
      mapProvider: "google_maps",
      browserApiKey,
      configured: Boolean(browserApiKey),
    },
    {
      headers: {
        "Cache-Control": "private, max-age=300, stale-while-revalidate=900",
      },
    },
  );
}
