import { NextResponse } from "next/server";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import { ScreenprintingServiceError } from "@/lib/application/screenprinting/screenprinting-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";

export async function resolveSlug(context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
  return slug;
}

export async function readJson(request: Request) {
  return (await request.json().catch(() => ({}))) as Record<string, unknown>;
}

export async function requireTenantSession(slug: string) {
  const sessionEmail = await getTenantSessionEmailForSlug(slug);
  if (!sessionEmail) {
    return {
      sessionEmail: null,
      error: NextResponse.json({ ok: false, error: "Tenant login is required." }, { status: 401 }),
    };
  }

  return { sessionEmail, error: null };
}

export function screenprintingErrorResponse(error: unknown) {
  if (error instanceof ScreenprintingServiceError) {
    return NextResponse.json({ ok: false, error: error.code, message: error.message }, { status: error.status });
  }

  return NextResponse.json(
    { ok: false, error: error instanceof Error ? error.message : "screenprinting_request_failed" },
    { status: 500 },
  );
}
