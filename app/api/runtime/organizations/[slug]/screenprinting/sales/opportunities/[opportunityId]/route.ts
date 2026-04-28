import { NextResponse } from "next/server";
import { updateScreenprintingOpportunity } from "@/lib/application/screenprinting/screenprinting-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";
import { readJson, requireTenantSession, resolveSlug, screenprintingErrorResponse } from "../../../_shared";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string; opportunityId: string }> | { slug: string; opportunityId: string } },
) {
  try {
    const slug = await resolveSlug(context);
    const session = await requireTenantSession(slug);
    if (session.error) {
      return session.error;
    }
    const { opportunityId } = await resolveRouteParams(context.params);
    const opportunity = await updateScreenprintingOpportunity(slug, opportunityId, await readJson(request));
    return NextResponse.json({ ok: true, opportunity });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}
