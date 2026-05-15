import type { WorkspaceDefinition } from "@/lib/domain/workspace";
import { defaultOrgSlug, orgScopedHref } from "@/lib/presentation/org-slug";

export function normalizeLoginEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidLoginEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function onboardingRedirect(email: string, templateId = "field-ops-starter") {
  const params = new URLSearchParams({
    email,
    templateId,
  });
  return `/onboarding?${params.toString()}`;
}

export function ownerEmailsFromEnvironment(environment: NodeJS.ProcessEnv = process.env) {
  return [
    environment.OWNER_EMAIL,
    environment.PLATFORM_OWNER_EMAILS,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformOwnerEmail(email: string, environment: NodeJS.ProcessEnv = process.env) {
  const normalized = normalizeLoginEmail(email);
  return ownerEmailsFromEnvironment(environment).includes(normalized);
}

export function normalizeRequestedOrgSlug(value: unknown) {
  return typeof value === "string" && /^[a-z0-9-]+$/.test(value.trim()) ? value.trim() : null;
}

export function workspaceRedirectPath(_workspace: Pick<WorkspaceDefinition, "connectors" | "defaultRedirectPath">) {
  return "/today";
}

export function requestedOwnerSlug(requestedSlug?: string | null) {
  return requestedSlug?.trim() || defaultOrgSlug();
}

export function existingWorkspaceAccess(input: {
  slug: string;
  name: string;
  workspace: Pick<WorkspaceDefinition, "id" | "selfServe" | "connectors" | "defaultRedirectPath">;
  accessMethod: "membership" | "domain_template" | "platform_owner";
}) {
  return {
    slug: input.slug,
    name: input.name,
    redirectTo: orgScopedHref(workspaceRedirectPath(input.workspace), input.slug),
    templateId: input.workspace.id,
    accessMethod: input.accessMethod,
    selfServe: input.workspace.selfServe,
  };
}
