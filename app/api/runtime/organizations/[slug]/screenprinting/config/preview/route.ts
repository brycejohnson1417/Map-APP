import { NextResponse } from "next/server";
import { previewScreenprintingConfigChange } from "@/lib/application/screenprinting/screenprinting-service";
import type { ScreenprintingConfigSection } from "@/lib/application/screenprinting/config";
import { readJson, resolveSlug, screenprintingErrorResponse } from "../../_shared";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  try {
    const slug = await resolveSlug(context);
    const body = await readJson(request);
    const impact = await previewScreenprintingConfigChange(slug, {
      section: body.section as ScreenprintingConfigSection,
      draftChanges: body.draftChanges,
    });
    return NextResponse.json({ ok: true, previewToken: impact.previewToken, impact });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}
