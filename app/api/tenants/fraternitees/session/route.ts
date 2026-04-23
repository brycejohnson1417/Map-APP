import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { TENANT_SESSION_EMAIL_COOKIE, TENANT_SESSION_SLUG_COOKIE } from "@/lib/application/auth/tenant-access";
import { FRATERNITEES_SESSION_COOKIE, isFraterniteesEmail } from "@/lib/application/fraternitees/onboarding-service";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = body.email?.trim().toLowerCase() ?? "";

  if (!isFraterniteesEmail(email)) {
    return NextResponse.json({ ok: false, error: "Use a Fraternitees.com email address." }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(FRATERNITEES_SESSION_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  cookieStore.set(TENANT_SESSION_EMAIL_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  cookieStore.set(TENANT_SESSION_SLUG_COOKIE, "fraternitees", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(FRATERNITEES_SESSION_COOKIE);
  cookieStore.delete(TENANT_SESSION_EMAIL_COOKIE);
  cookieStore.delete(TENANT_SESSION_SLUG_COOKIE);
  return NextResponse.json({ ok: true });
}
