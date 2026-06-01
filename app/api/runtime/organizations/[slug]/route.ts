import { NextResponse } from "next/server";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import { getOrganizationRuntimeSnapshot } from "@/lib/application/runtime/organization-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";

export async function GET(_: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
  const sessionEmail = await getTenantSessionEmailForSlug(slug);
  if (!sessionEmail) {
    return NextResponse.json({ ok: false, error: "Tenant login is required." }, { status: 401 });
  }

  const snapshot = await getOrganizationRuntimeSnapshot(slug);

  if (!snapshot) {
    return NextResponse.json({ ok: false, error: "organization_not_found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      ok: true,
      snapshot,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=10, stale-while-revalidate=60",
      },
    },
  );
}
