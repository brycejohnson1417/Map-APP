import { NextResponse } from "next/server";
import { markAllScreenprintingAlertsRead } from "@/lib/application/screenprinting/screenprinting-service";
import { requireTenantSession, resolveSlug, screenprintingErrorResponse } from "../../../_shared";

export async function POST(_request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  try {
    const slug = await resolveSlug(context);
    const session = await requireTenantSession(slug);
    if (session.error) {
      return session.error;
    }
    const updated = await markAllScreenprintingAlertsRead(slug);
    return NextResponse.json({ ok: true, updated });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}
