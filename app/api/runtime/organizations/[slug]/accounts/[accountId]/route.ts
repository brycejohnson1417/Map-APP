import { NextResponse } from "next/server";
import { requireRuntimeTenantAccess } from "@/lib/application/auth/runtime-authorization";
import { getAccountRuntimeDetail } from "@/lib/application/runtime/account-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";

export async function GET(
  _: Request,
  context: { params: Promise<{ slug: string; accountId: string }> | { slug: string; accountId: string } },
) {
  const { slug, accountId } = await resolveRouteParams(context.params);
  const access = await requireRuntimeTenantAccess(slug, "Tenant login is required to view account details.");
  if (access.response) {
    return access.response;
  }

  const detail = await getAccountRuntimeDetail(slug, accountId);

  if (!detail) {
    return NextResponse.json({ ok: false, error: "account_not_found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      ok: true,
      detail,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=10, stale-while-revalidate=45",
      },
    },
  );
}
