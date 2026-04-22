import { AppFrame } from "@/components/layout/app-frame";
import { MigratedTerritoryDashboard } from "@/components/territory/migrated-territory-dashboard";
import { RuntimeStatusPanel } from "@/components/runtime/runtime-status-panel";
import { TerritoryFoundationPreview } from "@/components/territory/territory-foundation-preview";
import { getTerritoryRuntimeDashboard } from "@/lib/application/runtime/territory-service";

export const dynamic = "force-dynamic";

interface TerritoryPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TerritoryPage({ searchParams }: TerritoryPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const orgSlug = process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG?.trim() || process.env.ORG_SLUG?.trim() || "picc";
  const dashboard = await getTerritoryRuntimeDashboard(orgSlug, resolvedSearchParams);

  return (
    <AppFrame>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent-secondary-strong)]">
            Territory
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] md:text-6xl">Migrated territory runtime</h1>
          <p className="max-w-4xl text-base leading-8 text-[var(--text-secondary)]">
            This surface reads normalized Supabase accounts, orders, boundaries, and rep-marker records. It is the
            migrated runtime path that replaces the old sync-on-read territory stack.
          </p>
        </div>
        {dashboard ? (
          <MigratedTerritoryDashboard dashboard={dashboard} />
        ) : (
          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-sm text-[var(--text-secondary)]">
              No runtime organization was found for slug <span className="font-semibold text-[var(--text-primary)]">{orgSlug}</span>.
            </p>
          </div>
        )}
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <TerritoryFoundationPreview />
          <RuntimeStatusPanel />
        </div>
      </div>
    </AppFrame>
  );
}
