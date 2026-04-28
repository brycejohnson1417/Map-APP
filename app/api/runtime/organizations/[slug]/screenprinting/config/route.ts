import { NextResponse } from "next/server";
import {
  getScreenprintingConfigPayload,
  updateScreenprintingConfig,
} from "@/lib/application/screenprinting/screenprinting-service";
import type { ScreenprintingConfigSection } from "@/lib/application/screenprinting/config";
import { readJson, requireTenantSession, resolveSlug, screenprintingErrorResponse } from "../_shared";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  try {
    const slug = await resolveSlug(context);
    const payload = await getScreenprintingConfigPayload(slug);
    return NextResponse.json({ ok: true, ...payload });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  try {
    const slug = await resolveSlug(context);
    const session = await requireTenantSession(slug);
    if (session.error) {
      return session.error;
    }
    const body = await readJson(request);
    const result = await updateScreenprintingConfig(slug, {
      section: body.section as ScreenprintingConfigSection,
      changes: body.changes,
      previewToken: typeof body.previewToken === "string" ? body.previewToken : null,
      actorEmail: session.sessionEmail,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}
