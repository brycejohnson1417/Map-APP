import { NextResponse } from "next/server";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import { geocodeMissingRuntimeAccounts } from "@/lib/application/runtime/geocode-accounts-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";

export const maxDuration = 60;

export async function POST(request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
  const sessionEmail = await getTenantSessionEmailForSlug(slug);
  if (!sessionEmail) {
    return NextResponse.json({ ok: false, error: "Tenant login is required to geocode accounts." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { limit?: number };

  try {
    const summary = await geocodeMissingRuntimeAccounts({
      organizationSlug: slug,
      limit: body.limit,
    });
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "geocode_failed";
    return NextResponse.json({ ok: false, error: message }, { status: message === "organization_not_found" ? 404 : 502 });
  }
}
