import { AppFrame } from "@/components/layout/app-frame";
import { TerritoryWorkspace } from "@/components/territory/territory-workspace";
import { getTerritoryRuntimeDashboard } from "@/lib/application/runtime/territory-service";
import { getWorkspaceExperienceBySlug } from "@/lib/application/workspace/workspace-service";
import { orgSlugFromSearchParams } from "@/lib/presentation/org-slug";

export const dynamic = "force-dynamic";

interface TerritoryPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TerritoryPage({ searchParams }: TerritoryPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const orgSlug = orgSlugFromSearchParams(resolvedSearchParams);
  const workspace = await getWorkspaceExperienceBySlug(orgSlug);
  const dashboard = await getTerritoryRuntimeDashboard(orgSlug, resolvedSearchParams);

  return (
    <AppFrame organizationName={dashboard?.organization.name} organizationSlug={orgSlug}>
      {dashboard ? (
        <TerritoryWorkspace
          orgSlug={orgSlug}
          initialDashboard={dashboard}
          territoryConfig={workspace.workspace.modules.territory ?? null}
        />
      ) : (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-sm text-[var(--text-secondary)]">
              No company workspace was found for slug <span className="font-semibold text-[var(--text-primary)]">{orgSlug}</span>.
            </p>
          </div>
        </div>
      )}
    </AppFrame>
  );
}
