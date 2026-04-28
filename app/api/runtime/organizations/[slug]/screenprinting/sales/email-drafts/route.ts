import { NextResponse } from "next/server";
import { renderScreenprintingEmailDraft } from "@/lib/application/screenprinting/screenprinting-service";
import { readJson, requireTenantSession, resolveSlug, screenprintingErrorResponse } from "../../_shared";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  try {
    const slug = await resolveSlug(context);
    const session = await requireTenantSession(slug);
    if (session.error) {
      return session.error;
    }
    const draft = await renderScreenprintingEmailDraft(slug, await readJson(request));
    return NextResponse.json({ ok: true, draft });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}
