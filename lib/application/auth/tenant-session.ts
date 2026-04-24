import "server-only";

import { cookies } from "next/headers";
import {
  PICC_SESSION_EMAIL_COOKIE,
  TENANT_SESSION_EMAIL_COOKIE,
  TENANT_SESSION_SLUG_COOKIE,
  emailHasTenantAccessToSlug,
} from "@/lib/application/auth/tenant-access";
import { FRATERNITEES_SESSION_COOKIE } from "@/lib/application/fraternitees/onboarding-service";

export async function getTenantSessionEmailForSlug(slug: string): Promise<string | null> {
  const cookieStore = await cookies();
  const tenantEmail = cookieStore.get(TENANT_SESSION_EMAIL_COOKIE)?.value ?? "";
  const tenantSlug = cookieStore.get(TENANT_SESSION_SLUG_COOKIE)?.value ?? "";
  const directFraterniteesEmail = cookieStore.get(FRATERNITEES_SESSION_COOKIE)?.value ?? "";
  const directPiccEmail = cookieStore.get(PICC_SESSION_EMAIL_COOKIE)?.value ?? "";

  if (tenantSlug === slug && tenantEmail && (await emailHasTenantAccessToSlug(tenantEmail, slug))) {
    return tenantEmail;
  }

  if (directFraterniteesEmail && (await emailHasTenantAccessToSlug(directFraterniteesEmail, slug))) {
    return directFraterniteesEmail;
  }

  if (directPiccEmail && (await emailHasTenantAccessToSlug(directPiccEmail, slug))) {
    return directPiccEmail;
  }

  return null;
}
