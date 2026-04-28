import { NextResponse } from "next/server";
import {
  createScreenprintingCampaign,
  listScreenprintingCampaigns,
} from "@/lib/application/screenprinting/screenprinting-service";
import { readJson, requireTenantSession, resolveSlug, screenprintingErrorResponse } from "../../_shared";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  try {
    return NextResponse.json({ ok: true, ...(await listScreenprintingCampaigns(await resolveSlug(context))) });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  try {
    const slug = await resolveSlug(context);
    const session = await requireTenantSession(slug);
    if (session.error) {
      return session.error;
    }
    const campaign = await createScreenprintingCampaign(slug, await readJson(request));
    return NextResponse.json({ ok: true, campaign });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}
