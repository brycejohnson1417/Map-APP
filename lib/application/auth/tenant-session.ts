import "server-only";

import { cookies } from "next/headers";
import {
  TENANT_SESSION_EMAIL_COOKIE,
  TENANT_SESSION_SLUG_COOKIE,
  emailHasTenantAccessToSlug,
} from "@/lib/application/auth/tenant-access";

export async function getTenantSessionEmailForSlug(slug: string): Promise<string | null> {
  const cookieStore = await cookies();
  const tenantEmail = cookieStore.get(TENANT_SESSION_EMAIL_COOKIE)?.value ?? "";
  const tenantSlug = cookieStore.get(TENANT_SESSION_SLUG_COOKIE)?.value ?? "";

  if (tenantSlug === slug && tenantEmail && (await emailHasTenantAccessToSlug(tenantEmail, slug))) {
    return tenantEmail;
  }

  return null;
}
