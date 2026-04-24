import { redirect } from "next/navigation";
import { AppFrame } from "@/components/layout/app-frame";
import { ChangeRequestList } from "@/components/change-requests/change-request-list";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import { listChangeRequestsForOrganization } from "@/lib/application/change-requests/change-request-service";
import { getWorkspaceExperienceBySlug } from "@/lib/application/workspace/workspace-service";
import { orgSlugFromSearchParams } from "@/lib/presentation/org-slug";

export const dynamic = "force-dynamic";

interface ChangeRequestsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ChangeRequestsPage({ searchParams }: ChangeRequestsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const orgSlug = orgSlugFromSearchParams(resolvedSearchParams);
  const workspace = await getWorkspaceExperienceBySlug(orgSlug);
  const sessionEmail = await getTenantSessionEmailForSlug(orgSlug);

  if (!sessionEmail) {
    redirect(`/login?org=${encodeURIComponent(orgSlug)}`);
  }

  if (!workspace.organization) {
    return (
      <AppFrame organizationName={workspace.workspace.displayName} organizationSlug={orgSlug}>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 md:px-10">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 text-sm text-[var(--text-secondary)]">
            No company workspace was found for {orgSlug}.
          </div>
        </div>
      </AppFrame>
    );
  }

  const requests = await listChangeRequestsForOrganization(workspace.organization.id);

  return (
    <AppFrame organizationName={workspace.organization.name} organizationSlug={orgSlug}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent-secondary-strong)]">Change requests</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">{workspace.organization.name} change queue</h1>
          <p className="mt-3 max-w-3xl text-base leading-8 text-[var(--text-secondary)]">
            Leave comments directly on the screen you want changed. The queue keeps the screenshot and your notes together so the work can be picked up cleanly without a long back-and-forth.
          </p>
        </header>

        <ChangeRequestList initialRequests={requests} />
      </div>
    </AppFrame>
  );
}
