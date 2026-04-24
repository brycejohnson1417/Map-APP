import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  PICC_SESSION_EMAIL_COOKIE,
  TENANT_SESSION_EMAIL_COOKIE,
  TENANT_SESSION_TEMPLATE_COOKIE,
  TENANT_SESSION_SLUG_COOKIE,
  getTenantCookieSlug,
  resolveTenantAccess,
} from "@/lib/application/auth/tenant-access";
import { FRATERNITEES_SESSION_COOKIE } from "@/lib/application/fraternitees/onboarding-service";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 14,
};

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

  const cookieStore = await cookies();
  cookieStore.set(TENANT_SESSION_EMAIL_COOKIE, email, cookieOptions);
  cookieStore.set(TENANT_SESSION_TEMPLATE_COOKIE, access.templateId, cookieOptions);
  const tenantCookieSlug = getTenantCookieSlug(access);
  if (tenantCookieSlug) {
    cookieStore.set(TENANT_SESSION_SLUG_COOKIE, tenantCookieSlug, cookieOptions);
  } else {
    cookieStore.delete(TENANT_SESSION_SLUG_COOKIE);
  }

  if (access.slug === "fraternitees") {
    cookieStore.set(FRATERNITEES_SESSION_COOKIE, email, cookieOptions);
  }
  if (access.slug === "picc") {
    cookieStore.set(PICC_SESSION_EMAIL_COOKIE, email, cookieOptions);
  }

  return NextResponse.json({ ok: true, access });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(TENANT_SESSION_EMAIL_COOKIE);
  cookieStore.delete(TENANT_SESSION_SLUG_COOKIE);
  cookieStore.delete(TENANT_SESSION_TEMPLATE_COOKIE);
  cookieStore.delete(FRATERNITEES_SESSION_COOKIE);
  cookieStore.delete(PICC_SESSION_EMAIL_COOKIE);
  return NextResponse.json({ ok: true });
}
