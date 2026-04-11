import { NextResponse } from "next/server";
import { getOrganizationRuntimeSnapshot } from "@/lib/application/runtime/organization-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";

export async function GET(_: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
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
