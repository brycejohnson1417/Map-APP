import { NextResponse } from "next/server";
import {
  getScreenprintingSocialAccount,
  updateScreenprintingSocialAccount,
} from "@/lib/application/screenprinting/screenprinting-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";
import { readJson, requireTenantSession, resolveSlug, screenprintingErrorResponse } from "../../../_shared";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string; socialAccountId: string }> | { slug: string; socialAccountId: string } },
) {
  try {
    const slug = await resolveSlug(context);
    const { socialAccountId } = await resolveRouteParams(context.params);
    return NextResponse.json({ ok: true, ...(await getScreenprintingSocialAccount(slug, socialAccountId)) });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string; socialAccountId: string }> | { slug: string; socialAccountId: string } },
) {
  try {
    const slug = await resolveSlug(context);
    const session = await requireTenantSession(slug);
    if (session.error) {
      return session.error;
    }
    const { socialAccountId } = await resolveRouteParams(context.params);
    const socialAccount = await updateScreenprintingSocialAccount(slug, socialAccountId, await readJson(request));
    return NextResponse.json({ ok: true, socialAccount });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}
