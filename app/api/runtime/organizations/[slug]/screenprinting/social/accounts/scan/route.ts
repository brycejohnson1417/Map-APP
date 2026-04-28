import { NextResponse } from "next/server";
import { scanScreenprintingSocialAccounts } from "@/lib/application/screenprinting/screenprinting-service";
import { requireTenantSession, resolveSlug, screenprintingErrorResponse } from "../../../_shared";

export async function POST(_request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  try {
    const slug = await resolveSlug(context);
    const session = await requireTenantSession(slug);
    if (session.error) {
      return session.error;
    }
    return NextResponse.json({ ok: true, ...(await scanScreenprintingSocialAccounts(slug)) });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}
