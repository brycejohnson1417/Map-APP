import "server-only";

import { cache } from "react";
import type { Organization } from "@/lib/domain/runtime";
import type { WorkspaceDefinition } from "@/lib/domain/workspace";
import { OrganizationRepository } from "@/lib/infrastructure/supabase/organization-repository";
import { compileWorkspaceExperience } from "@/lib/platform/workspace/compiler";

const organizations = new OrganizationRepository();

export interface WorkspaceRuntimeExperience {
  organization: Organization | null;
  workspace: WorkspaceDefinition;
  navigation: WorkspaceDefinition["navigation"];
  defaultRedirectPath: string;
  accountDirectoryVariant: string | null;
  accountDetailSections: string[];
  territoryVariant: string | null;
  integrationsVariant: string | null;
  allowChangeRequests: boolean;
}

export const getWorkspaceExperienceBySlug = cache(async (slug: string): Promise<WorkspaceRuntimeExperience> => {
  const organization = await organizations.findBySlug(slug);
  const compiled = compileWorkspaceExperience({
    slug,
    organization,
  });

  return {
    organization,
    ...compiled,
  };
});

export const getWorkspaceDefinitionBySlug = cache(async (slug: string): Promise<WorkspaceDefinition> => {
  const workspace = await getWorkspaceExperienceBySlug(slug);
  return workspace.workspace;
});
