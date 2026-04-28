import { NextResponse } from "next/server";
import { getScreenprintingSocialConnectionReadiness } from "@/lib/application/screenprinting/screenprinting-service";
import { resolveSlug, screenprintingErrorResponse } from "../../_shared";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  try {
    return NextResponse.json({ ok: true, connection: await getScreenprintingSocialConnectionReadiness(await resolveSlug(context)) });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}
