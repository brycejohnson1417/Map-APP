import type { WorkspaceDefinition } from "@/lib/domain/workspace";
import { compileWorkspaceDefinition } from "@/lib/platform/workspace/registry";
import type { Organization } from "@/lib/domain/runtime";

export interface CompiledWorkspaceExperience {
  workspace: WorkspaceDefinition;
  navigation: WorkspaceDefinition["navigation"];
  defaultRedirectPath: string;
  accountDirectoryVariant: string | null;
  accountDetailSections: string[];
  territoryVariant: string | null;
  integrationsVariant: string | null;
  allowChangeRequests: boolean;
}

export function compileWorkspaceExperience(input: {
  slug?: string | null;
  organization?: Pick<Organization, "slug" | "settings"> | null;
  templateId?: string | null;
}): CompiledWorkspaceExperience {
  const workspace = compileWorkspaceDefinition(input);

  return {
    workspace,
    navigation: workspace.navigation,
    defaultRedirectPath: workspace.defaultRedirectPath,
    accountDirectoryVariant: workspace.modules.accounts?.variant ?? null,
    accountDetailSections: workspace.modules.accountDetail?.sections ?? [],
    territoryVariant: workspace.modules.territory?.variant ?? null,
    integrationsVariant: workspace.modules.integrations?.variant ?? null,
    allowChangeRequests: workspace.changeRequests.enabled,
  };
}
