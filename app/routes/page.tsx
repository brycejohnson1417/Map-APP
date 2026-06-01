import { AppFrame } from "@/components/layout/app-frame";
import { SavedRoutesWorkspace } from "@/components/routes/saved-routes-workspace";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import { listSavedRoutes } from "@/lib/application/runtime/saved-route-service";
import { getWorkspaceExperienceBySlug } from "@/lib/application/workspace/workspace-service";
import { orgSlugFromSearchParams } from "@/lib/presentation/org-slug";

export const dynamic = "force-dynamic";

interface RoutesPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RoutesPage({ searchParams }: RoutesPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const orgSlug = orgSlugFromSearchParams(resolvedSearchParams);
  const workspace = await getWorkspaceExperienceBySlug(orgSlug);
  const sessionEmail = await getTenantSessionEmailForSlug(orgSlug);
  const initialRoutes = sessionEmail
    ? await listSavedRoutes(orgSlug, sessionEmail).catch(() => [])
    : null;

  return (
    <AppFrame organizationName={workspace.organization?.name} organizationSlug={orgSlug}>
      <SavedRoutesWorkspace
        orgSlug={orgSlug}
        organizationName={workspace.organization?.name ?? workspace.workspace.displayName}
        initialRoutes={initialRoutes ?? []}
        permissionDenied={!sessionEmail}
      />
    </AppFrame>
  );
}
