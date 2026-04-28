import { NextResponse } from "next/server";
import {
  listScreenprintingManagerGoals,
  saveScreenprintingManagerGoals,
} from "@/lib/application/screenprinting/screenprinting-service";
import { readJson, requireTenantSession, resolveSlug, screenprintingErrorResponse } from "../../_shared";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  try {
    const url = new URL(request.url);
    return NextResponse.json({
      ok: true,
      ...(await listScreenprintingManagerGoals(await resolveSlug(context), { period: url.searchParams.get("period") })),
    });
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
    return NextResponse.json({ ok: true, ...(await saveScreenprintingManagerGoals(slug, await readJson(request))) });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}
