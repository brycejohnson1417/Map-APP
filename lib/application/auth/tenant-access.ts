export const TENANT_SESSION_EMAIL_COOKIE = "tenant_session_email";
export const TENANT_SESSION_SLUG_COOKIE = "tenant_session_slug";
export const PICC_SESSION_EMAIL_COOKIE = "picc_session_email";

export interface TenantAccess {
  slug: "picc" | "fraternitees";
  name: string;
  redirectTo: string;
}

export function resolveTenantAccess(email: string): TenantAccess | null {
  const normalized = email.trim().toLowerCase();

  if (/^[^\s@]+@fraternitees\.com$/.test(normalized)) {
    return {
      slug: "fraternitees",
      name: "FraterniTees",
      redirectTo: "/accounts?org=fraternitees",
    };
  }

  if (/^[^\s@]+@piccplatform\.com$/.test(normalized)) {
    return {
      slug: "picc",
      name: "PICC New York",
      redirectTo: "/territory?org=picc",
    };
  }

  return null;
}
