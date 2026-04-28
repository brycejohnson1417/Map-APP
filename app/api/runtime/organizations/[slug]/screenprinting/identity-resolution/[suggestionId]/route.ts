import { NextResponse } from "next/server";
import { updateScreenprintingIdentityResolution } from "@/lib/application/screenprinting/screenprinting-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";
import { readJson, requireTenantSession, resolveSlug, screenprintingErrorResponse } from "../../_shared";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string; suggestionId: string }> | { slug: string; suggestionId: string } },
) {
  try {
    const slug = await resolveSlug(context);
    const session = await requireTenantSession(slug);
    if (session.error) {
      return session.error;
    }
    const { suggestionId } = await resolveRouteParams(context.params);
    return NextResponse.json({
      ok: true,
      ...(await updateScreenprintingIdentityResolution(slug, suggestionId, await readJson(request))),
    });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}
