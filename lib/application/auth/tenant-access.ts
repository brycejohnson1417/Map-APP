import "server-only";

import { cookies } from "next/headers";
import {
  existingWorkspaceAccess,
  isPlatformOwnerEmail,
  isValidLoginEmail,
  normalizeLoginEmail,
  normalizeRequestedOrgSlug,
  onboardingRedirect,
  requestedOwnerSlug,
} from "@/lib/application/auth/tenant-routing";
import { OrganizationMemberRepository } from "@/lib/infrastructure/supabase/organization-member-repository";
import { compileWorkspaceExperience } from "@/lib/platform/workspace/compiler";
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
  accessMethod: "membership" | "domain_template" | "self_serve" | "platform_owner";
  selfServe: boolean;
}

const members = new OrganizationMemberRepository();
const organizations = new OrganizationRepository();

export function guessTenantAccess(email: string): TenantAccess | null {
  const normalized = normalizeLoginEmail(email);
  if (!isValidLoginEmail(normalized)) {
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

export async function resolveTenantAccess(
  email: string,
  options: {
    requestedSlug?: string | null;
  } = {},
): Promise<TenantAccess | null> {
  const normalized = normalizeLoginEmail(email);
  if (!isValidLoginEmail(normalized)) {
    return null;
  }
  const requestedSlug = normalizeRequestedOrgSlug(options.requestedSlug);

  if (isPlatformOwnerEmail(normalized)) {
    const ownerSlug = requestedOwnerSlug(requestedSlug);
    const compiled = compileWorkspaceExperience({ slug: ownerSlug });
    // Note: compileWorkspaceExperience does not return the organization object.
    // If we only have the slug, we fall back to the workspace display name.
    return existingWorkspaceAccess({
      slug: ownerSlug,
      name: compiled.workspace.displayName,
      workspace: compiled.workspace,
      accessMethod: "platform_owner",
    });
  }

  const existingMemberships = await members.listByEmail(normalized);
  if (existingMemberships.length) {
    const organizationsById = new Map(
      (await organizations.listByIds(existingMemberships.map((member) => member.organizationId))).map((organization) => [
        organization.id,
        organization,
      ]),
    );

    const prioritizedMembership =
      existingMemberships.find((m) => organizationsById.get(m.organizationId)?.slug === requestedSlug) ?? existingMemberships[0];

    if (prioritizedMembership) {
      const organization = organizationsById.get(prioritizedMembership.organizationId);
      if (organization) {
        const compiled = compileWorkspaceExperience({ slug: organization.slug, organization: organization });
        return existingWorkspaceAccess({
          slug: organization.slug,
          name: organization.name,
          workspace: compiled.workspace,
          accessMethod: "membership",
        });
      }
    }
  }

  const [, emailDomain = ""] = normalized.split("@");
  if (emailDomain) {
    const workspaceOrganization = await organizations.findFirstByWorkspaceEmailDomain(emailDomain);
    if (workspaceOrganization) {
      const compiled = compileWorkspaceExperience({ slug: workspaceOrganization.slug, organization: workspaceOrganization });
      return existingWorkspaceAccess({
        slug: workspaceOrganization.slug,
        name: workspaceOrganization.name,
        workspace: compiled.workspace,
        accessMethod: "domain_template",
      });
    }
  }

  const guessed = guessTenantAccess(normalized);
  if (guessed) {
    if (guessed.slug) {
      const existingOrganization = await organizations.findBySlug(guessed.slug).catch(() => null);
      if (existingOrganization) {
        const compiled = compileWorkspaceExperience({ slug: existingOrganization.slug, organization: existingOrganization });
        return existingWorkspaceAccess({
          slug: existingOrganization.slug,
          name: existingOrganization.name,
          workspace: compiled.workspace,
          accessMethod: "domain_template",
        });
      }
    }
    return guessed;
  }

  return null;
}

export async function emailHasTenantAccessToSlug(email: string, slug: string): Promise<boolean> {
  const normalized = normalizeLoginEmail(email);
  if (!isValidLoginEmail(normalized)) {
    return false;
  }

  if (isPlatformOwnerEmail(normalized)) {
    return true;
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

  const compiled = compileWorkspaceExperience({ slug });
  if (compiled.workspace.emailDomains.length) {
    const domain = normalized.split("@")[1] ?? "";
    return compiled.workspace.emailDomains.some((candidate: string) => candidate.toLowerCase() === domain);
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
