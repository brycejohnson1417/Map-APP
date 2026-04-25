import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, PlugZap } from "lucide-react";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import { FraterniteesWorkspace } from "@/components/fraternitees/fraternitees-portal";
import { AppFrame } from "@/components/layout/app-frame";
import { WorkspaceIntegrationsPanel } from "@/components/onboarding/workspace-integrations-panel";
import { getOrganizationRuntimeSnapshot } from "@/lib/application/runtime/organization-service";
import { getWorkspaceExperienceBySlug } from "@/lib/application/workspace/workspace-service";
import { resolvePrintavoAutoSyncSettings } from "@/lib/application/fraternitees/printavo-auto-sync-settings";
import { resolveTenantPluginSettings } from "@/lib/application/runtime/plugin-settings";
import { orgSlugFromSearchParams } from "@/lib/presentation/org-slug";

export const dynamic = "force-dynamic";

interface IntegrationsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function IntegrationsPage({ searchParams }: IntegrationsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const orgSlug = orgSlugFromSearchParams(resolvedSearchParams);
  const workspace = await getWorkspaceExperienceBySlug(orgSlug);
  const sessionEmail = await getTenantSessionEmailForSlug(orgSlug);

  if (!sessionEmail) {
    redirect(`/login?org=${encodeURIComponent(orgSlug)}`);
  }

  const snapshot = await getOrganizationRuntimeSnapshot(orgSlug);
  if (!snapshot) {
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

  if (workspace.integrationsVariant === "fraternity_integrations") {
    return (
      <AppFrame organizationName={snapshot.organization.name} organizationSlug={orgSlug}>
        <FraterniteesWorkspace
          orgSlug={orgSlug}
          workspaceName={snapshot.organization.name}
          sessionEmail={sessionEmail}
          integrations={snapshot.integrations.map((integration) => ({
            id: integration.id,
            provider: integration.provider,
            displayName: integration.displayName,
            externalAccountId: integration.externalAccountId,
            status: integration.status,
            updatedAt: integration.updatedAt,
          }))}
          pluginSettings={resolveTenantPluginSettings(snapshot.organization.slug, snapshot.organization.settings)}
          autoSyncSettings={resolvePrintavoAutoSyncSettings(snapshot.organization.settings)}
        />
      </AppFrame>
    );
  }

  return (
    <AppFrame organizationName={snapshot.organization.name} organizationSlug={orgSlug}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 md:px-10">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent-secondary-strong)]">
            Integrations & Plugins
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">Workspace controls</h1>
        </header>
        <WorkspaceIntegrationsPanel
          orgSlug={orgSlug}
          workspace={workspace.workspace}
          integrations={snapshot.integrations.map((integration) => ({
            id: integration.id,
            provider: integration.provider,
            displayName: integration.displayName,
            externalAccountId: integration.externalAccountId,
            status: integration.status,
            updatedAt: integration.updatedAt,
          }))}
          pluginSettings={resolveTenantPluginSettings(snapshot.organization.slug, snapshot.organization.settings)}
        />
        <section className="grid gap-4 md:grid-cols-2">
          <Link href={`/runtime/${orgSlug}`} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
            <BarChart3 className="h-5 w-5 text-[var(--accent-secondary-strong)]" />
            <h2 className="mt-4 text-xl font-semibold">Runtime</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Review sync cursors, jobs, integrations, and runtime health.</p>
          </Link>
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
            <PlugZap className="h-5 w-5 text-[var(--accent-primary)]" />
            <h2 className="mt-4 text-xl font-semibold">Plugins</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Tenant plugin controls will live here as additional integrations are enabled.</p>
          </div>
        </section>
      </div>
    </AppFrame>
  );
}
