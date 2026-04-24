import { NextResponse } from "next/server";
import {
  clearTenantSessionCookies,
  resolveTenantAccess,
  writeTenantSessionCookies,
} from "@/lib/application/auth/tenant-access";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const access = await resolveTenantAccess(email);

  if (!access) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid work email address." },
      { status: 400 },
    );
  }

  await writeTenantSessionCookies({
    email,
    slug: access.slug,
    templateId: access.templateId,
  });

  return NextResponse.json({ ok: true, access });
}

export async function DELETE() {
  await clearTenantSessionCookies();
  return NextResponse.json({ ok: true });
}
