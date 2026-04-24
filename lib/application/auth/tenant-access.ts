import "server-only";

import { cookies } from "next/headers";
import { getWorkspaceExperienceBySlug } from "@/lib/application/workspace/workspace-service";
import { OrganizationMemberRepository } from "@/lib/infrastructure/supabase/organization-member-repository";
import { OrganizationRepository } from "@/lib/infrastructure/supabase/organization-repository";
import { resolveWorkspaceTemplateForEmailDomain } from "@/lib/platform/workspace/registry";
import { orgScopedHref } from "@/lib/presentation/org-slug";

export const TENANT_SESSION_EMAIL_COOKIE = "tenant_session_email";
export const TENANT_SESSION_SLUG_COOKIE = "tenant_session_slug";
export const TENANT_SESSION_TEMPLATE_COOKIE = "tenant_session_template";

export const tenantSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 14,
};

export interface TenantAccess {
  slug: string | null;
  name: string;
  redirectTo: string;
  templateId: string;
  accessMethod: "membership" | "domain_template" | "self_serve";
  selfServe: boolean;
}

const members = new OrganizationMemberRepository();
const organizations = new OrganizationRepository();

function normalizeEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return normalized;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function onboardingRedirect(email: string, templateId = "field-ops-starter") {
  const params = new URLSearchParams({
    email,
    templateId,
  });
  return `/onboarding?${params.toString()}`;
}

export function guessTenantAccess(email: string): TenantAccess | null {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    return null;
  }

  const template = resolveWorkspaceTemplateForEmailDomain(normalized);
  if (!template) {
    return {
      slug: null,
      name: "New workspace",
      redirectTo: onboardingRedirect(normalized),
      templateId: "field-ops-starter",
      accessMethod: "self_serve",
      selfServe: true,
    };
  }

  return {
    slug: template.defaultOrgSlug,
    name: template.displayName,
    redirectTo: template.selfServe
      ? onboardingRedirect(normalized, template.id)
      : orgScopedHref(template.defaultRedirectPath, template.defaultOrgSlug),
    templateId: template.id,
    accessMethod: template.selfServe ? "self_serve" : "domain_template",
    selfServe: template.selfServe,
  };
}

export async function resolveTenantAccess(email: string): Promise<TenantAccess | null> {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    return null;
  }

  const existingMemberships = await members.listByEmail(normalized);
  if (existingMemberships.length) {
    const organizationsById = new Map(
      (await organizations.listByIds(existingMemberships.map((member) => member.organizationId))).map((organization) => [
        organization.id,
        organization,
      ]),
    );

    for (const membership of existingMemberships) {
      const organization = organizationsById.get(membership.organizationId);
      if (!organization) {
        continue;
      }

      const workspace = await getWorkspaceExperienceBySlug(organization.slug);
      return {
        slug: organization.slug,
        name: organization.name,
        redirectTo: orgScopedHref(workspace.defaultRedirectPath, organization.slug),
        templateId: workspace.workspace.id,
        accessMethod: "membership",
        selfServe: workspace.workspace.selfServe,
      };
    }
  }

  const [, emailDomain = ""] = normalized.split("@");
  if (emailDomain) {
    const workspaceOrganization = await organizations.findFirstByWorkspaceEmailDomain(emailDomain);
    if (workspaceOrganization) {
      const workspace = await getWorkspaceExperienceBySlug(workspaceOrganization.slug);
      return {
        slug: workspaceOrganization.slug,
        name: workspaceOrganization.name,
        redirectTo: orgScopedHref(workspace.defaultRedirectPath, workspaceOrganization.slug),
        templateId: workspace.workspace.id,
        accessMethod: "domain_template",
        selfServe: workspace.workspace.selfServe,
      };
    }
  }

  const guessed = guessTenantAccess(normalized);
  if (guessed) {
    return guessed;
  }

  return null;
}

export async function emailHasTenantAccessToSlug(email: string, slug: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    return false;
  }

  const existingMemberships = await members.listByEmail(normalized);
  if (existingMemberships.some((membership) => membership.organizationId)) {
    const matchingOrganization = await organizations.findBySlug(slug);
    if (matchingOrganization && existingMemberships.some((membership) => membership.organizationId === matchingOrganization.id)) {
      return true;
    }
  }

  const guessed = guessTenantAccess(normalized);
  if (guessed?.slug === slug) {
    return true;
  }

  const [, emailDomain = ""] = normalized.split("@");
  if (emailDomain) {
    const workspaceOrganization = await organizations.findFirstByWorkspaceEmailDomain(emailDomain);
    if (workspaceOrganization?.slug === slug) {
      return true;
    }
  }

  const workspace = await getWorkspaceExperienceBySlug(slug);
  if (workspace.workspace.emailDomains.length) {
    const domain = normalized.split("@")[1] ?? "";
    return workspace.workspace.emailDomains.some((candidate) => candidate.toLowerCase() === domain);
  }

  return false;
}

export async function writeTenantSessionCookies(input: {
  email: string;
  slug?: string | null;
  templateId: string;
}) {
  const cookieStore = await cookies();
  cookieStore.set(TENANT_SESSION_EMAIL_COOKIE, input.email.trim().toLowerCase(), tenantSessionCookieOptions);
  cookieStore.set(TENANT_SESSION_TEMPLATE_COOKIE, input.templateId, tenantSessionCookieOptions);

  if (input.slug?.trim()) {
    cookieStore.set(TENANT_SESSION_SLUG_COOKIE, input.slug.trim(), tenantSessionCookieOptions);
    return;
  }

  cookieStore.delete(TENANT_SESSION_SLUG_COOKIE);
}

export async function clearTenantSessionCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(TENANT_SESSION_EMAIL_COOKIE);
  cookieStore.delete(TENANT_SESSION_SLUG_COOKIE);
  cookieStore.delete(TENANT_SESSION_TEMPLATE_COOKIE);
}
