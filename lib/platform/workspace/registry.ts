import fraterniteesWorkspace from "@/tenants/fraternitees/workspace.json";
import secondScreenprinterWorkspace from "@/tenants/second-screenprinter/workspace.json";
import starterWorkspace from "@/tenants/field-ops-starter/workspace.json";
import piccWorkspace from "@/tenants/picc/workspace.json";
import coreRuntimeManifest from "@/packages/core-runtime/manifest.json";
import accountDirectoryManifest from "@/packages/account-directory-kit/manifest.json";
import leadScoreManifest from "@/packages/lead-score-kit/manifest.json";
import trendModuleManifest from "@/packages/trend-module-kit/manifest.json";
import territoryMapManifest from "@/packages/territory-map-kit/manifest.json";
import changeRequestManifest from "@/packages/change-request-kit/manifest.json";
import connectorOnboardingManifest from "@/packages/connector-onboarding-kit/manifest.json";
import type { Organization } from "@/lib/domain/runtime";
import type { PackageManifest, WorkspaceDefinition, WorkspaceTemplateSummary } from "@/lib/domain/workspace";

const CHANGE_REQUEST_PACKAGE_ID = "change-request-kit";
const CHANGE_REQUEST_NAV_ID = "change_requests";
const CHANGE_REQUEST_NAV_ITEM: WorkspaceDefinition["navigation"][number] = {
  id: CHANGE_REQUEST_NAV_ID,
  label: "Change Requests",
  href: "/change-requests",
  icon: "MessagesSquare",
};

const fraterniteesWorkspaceDefinition = fraterniteesWorkspace as WorkspaceDefinition;
const secondScreenprinterWorkspaceDefinition = secondScreenprinterWorkspace as WorkspaceDefinition;
const piccWorkspaceDefinition = piccWorkspace as WorkspaceDefinition;
const starterWorkspaceDefinition = starterWorkspace as WorkspaceDefinition;

const workspaceTemplates = [
  fraterniteesWorkspaceDefinition,
  secondScreenprinterWorkspaceDefinition,
  piccWorkspaceDefinition,
  starterWorkspaceDefinition,
] satisfies WorkspaceDefinition[];

const packageManifests = [
  coreRuntimeManifest,
  accountDirectoryManifest,
  leadScoreManifest,
  trendModuleManifest,
  territoryMapManifest,
  changeRequestManifest,
  connectorOnboardingManifest,
] as PackageManifest[];

const workspaceTemplateById = new Map(workspaceTemplates.map((workspace) => [workspace.id, workspace]));
const workspaceTemplateByDefaultSlug = new Map(workspaceTemplates.map((workspace) => [workspace.defaultOrgSlug, workspace.id]));
const packageManifestById = new Map(packageManifests.map((manifest) => [manifest.id, manifest]));

function normalizeDomain(value: string) {
  return value.trim().toLowerCase();
}

function slugFallbackTemplateId(slug: string) {
  return workspaceTemplateByDefaultSlug.get(slug) ?? "field-ops-starter";
}

function deepMerge<T extends object>(base: T, override: Record<string, unknown> | undefined): T {
  if (!override) {
    return structuredClone(base);
  }

  const output = structuredClone(base) as Record<string, unknown>;

  for (const [key, value] of Object.entries(override)) {
    const current = output[key];
    if (
      current &&
      typeof current === "object" &&
      !Array.isArray(current) &&
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      output[key] = deepMerge(current as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      output[key] = value;
    }
  }

  return output as T;
}

function normalizeChangeRequestSupport(workspace: WorkspaceDefinition): WorkspaceDefinition {
  const normalized = structuredClone(workspace);

  if (!normalized.packages.includes(CHANGE_REQUEST_PACKAGE_ID)) {
    normalized.packages = [...normalized.packages, CHANGE_REQUEST_PACKAGE_ID];
  }

  if (!normalized.navigation.some((item) => item.id === CHANGE_REQUEST_NAV_ID || item.href === CHANGE_REQUEST_NAV_ITEM.href)) {
    normalized.navigation = [...normalized.navigation, CHANGE_REQUEST_NAV_ITEM];
  }

  normalized.changeRequests = {
    enabled: true,
    defaultClassification: normalized.changeRequests?.defaultClassification ?? "config",
    classifications:
      normalized.changeRequests?.classifications?.length
        ? normalized.changeRequests.classifications
        : ["config", "package", "primitive", "core"],
    allowAttachments: normalized.changeRequests?.allowAttachments ?? true,
  };

  return normalized;
}

export function listWorkspaceTemplates(): WorkspaceTemplateSummary[] {
  return workspaceTemplates
    .map((workspace) => ({
      id: workspace.id,
      displayName: workspace.displayName,
      templateLabel: workspace.templateLabel,
      description: workspace.description,
      selfServe: workspace.selfServe,
      defaultOrgSlug: workspace.defaultOrgSlug,
      emailDomains: workspace.emailDomains,
      tenantType: workspace.tenantType,
      branding: workspace.branding,
      connectors: workspace.connectors,
    }))
    .sort((left, right) => Number(right.selfServe) - Number(left.selfServe) || left.displayName.localeCompare(right.displayName));
}

export function findWorkspaceTemplateById(id: string) {
  return workspaceTemplateById.get(id) ?? null;
}

export function findPackageManifestById(id: string) {
  return packageManifestById.get(id) ?? null;
}

export function resolveWorkspaceTemplateForEmailDomain(email: string) {
  const [, domain = ""] = email.trim().toLowerCase().split("@");
  const normalizedDomain = normalizeDomain(domain);
  if (!normalizedDomain) {
    return null;
  }

  return (
    workspaceTemplates.find((workspace) => workspace.emailDomains.some((candidate) => normalizeDomain(candidate) === normalizedDomain)) ??
    null
  );
}

export function compileWorkspaceDefinition(input: {
  slug?: string | null;
  organization?: Pick<Organization, "slug" | "settings"> | null;
  templateId?: string | null;
}): WorkspaceDefinition {
  const templateId =
    input.templateId ||
    (typeof input.organization?.settings?.workspace === "object" &&
    input.organization.settings.workspace &&
    !Array.isArray(input.organization.settings.workspace)
      ? (input.organization.settings.workspace as Record<string, unknown>).templateId
      : null) ||
    slugFallbackTemplateId(input.organization?.slug ?? input.slug ?? "");

  const baseWorkspace: WorkspaceDefinition = findWorkspaceTemplateById(String(templateId)) ?? starterWorkspaceDefinition;
  const overrides =
    typeof input.organization?.settings?.workspace === "object" &&
    input.organization.settings.workspace &&
    !Array.isArray(input.organization.settings.workspace)
      ? ((input.organization.settings.workspace as Record<string, unknown>).overrides as Record<string, unknown> | undefined)
      : undefined;

  const compiled = normalizeChangeRequestSupport(deepMerge<WorkspaceDefinition>(baseWorkspace, overrides));

  for (const packageId of compiled.packages) {
    if (!packageManifestById.has(packageId)) {
      throw new Error(`Workspace "${compiled.id}" references missing package "${packageId}".`);
    }
  }

  return compiled;
}
