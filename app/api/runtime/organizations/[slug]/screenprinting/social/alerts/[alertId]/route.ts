import { NextResponse } from "next/server";
import { updateScreenprintingAlert } from "@/lib/application/screenprinting/screenprinting-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";
import { readJson, requireTenantSession, resolveSlug, screenprintingErrorResponse } from "../../../_shared";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string; alertId: string }> | { slug: string; alertId: string } },
) {
  try {
    const slug = await resolveSlug(context);
    const session = await requireTenantSession(slug);
    if (session.error) {
      return session.error;
    }
    const { alertId } = await resolveRouteParams(context.params);
    const alert = await updateScreenprintingAlert(slug, alertId, await readJson(request));
    return NextResponse.json({ ok: true, alert });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}
