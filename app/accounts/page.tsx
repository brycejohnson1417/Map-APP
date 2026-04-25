import Link from "next/link";
import { ArrowRight, MapPin, Search, Users } from "lucide-react";
import {
  FraterniteesLeadQualificationModule,
  type FraterniteesAccountsView,
} from "@/components/accounts/fraternitees-lead-qualification-module";
import { getFraterniteesAccountDirectory } from "@/lib/application/fraternitees/account-directory-service";
import { readPrintavoSyncStatus } from "@/lib/application/fraternitees/printavo-sync-service";
import { getWorkspaceExperienceBySlug } from "@/lib/application/workspace/workspace-service";
import { AppFrame } from "@/components/layout/app-frame";
import { getTerritoryRuntimeDashboard } from "@/lib/application/runtime/territory-service";
import { defaultOrgSlug, firstParamValue, orgScopedHref, orgSlugFromSearchParams } from "@/lib/presentation/org-slug";

export const dynamic = "force-dynamic";

interface AccountsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function normalizeAccountsView(value: string | string[] | undefined): FraterniteesAccountsView {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "leaderboard" ? "leaderboard" : "scoring";
}

export default async function AccountsPage({ searchParams }: AccountsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const orgSlug = orgSlugFromSearchParams(resolvedSearchParams);
  const activeView = normalizeAccountsView(resolvedSearchParams.view);
  const workspace = await getWorkspaceExperienceBySlug(orgSlug);
  const isLeadQualificationDirectory = workspace.accountDirectoryVariant === "lead_qualification";
  const fraterniteesDirectory =
    isLeadQualificationDirectory ? await getFraterniteesAccountDirectory(orgSlug, resolvedSearchParams) : null;
  const fraterniteesSyncStatus =
    fraterniteesDirectory?.organization.id ? await readPrintavoSyncStatus(fraterniteesDirectory.organization.id) : null;
  const dashboard =
    isLeadQualificationDirectory ? null : await getTerritoryRuntimeDashboard(orgSlug, resolvedSearchParams);
  const query = firstParamValue(resolvedSearchParams.q) ?? "";
  const organizationName =
    fraterniteesDirectory?.organization.name ??
    dashboard?.organization.name ??
    workspace.organization?.name ??
    process.env.ORG_NAME?.trim() ??
    workspace.workspace.displayName;
  const hasWorkspace = isLeadQualificationDirectory ? Boolean(fraterniteesDirectory) : Boolean(dashboard);

  return (
    <AppFrame organizationName={organizationName} organizationSlug={orgSlug}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
        <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent-secondary-strong)]">Accounts</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">{organizationName} accounts</h1>
            <p className="mt-3 max-w-3xl text-base leading-8 text-[var(--text-secondary)]">
              Search the same account records used by the territory map and account detail pages.
            </p>
          </div>
          <Link
            href={orgScopedHref("/territory", orgSlug)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--text-primary)] px-5 py-3 text-sm font-semibold text-white"
            style={{ color: "#fff" }}
          >
            Open map
            <MapPin className="h-4 w-4" />
          </Link>
        </header>

        {hasWorkspace ? (
          isLeadQualificationDirectory ? (
            <FraterniteesLeadQualificationModule
              orgSlug={orgSlug}
              directory={fraterniteesDirectory!}
              activeView={activeView}
              syncStatus={fraterniteesSyncStatus}
              gradeOptions={workspace.workspace.modules.accounts?.gradeOptions?.map(String)}
              sortOptions={workspace.workspace.modules.accounts?.sortOptions}
            />
          ) : (
            (() => {
              const runtimeDashboard = dashboard!;

              return (
                <>
              <form className="flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 sm:flex-row">
                {orgSlug !== defaultOrgSlug() ? <input type="hidden" name="org" value={orgSlug} /> : null}
                <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2">
                  <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
                  <input
                    name="q"
                    defaultValue={query}
                    placeholder="Search account, city, state"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-tertiary)]"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] px-5 py-3 text-sm font-semibold text-white"
                  style={{ color: "#fff" }}
                >
                  Search
                </button>
              </form>

              <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">Accounts</p>
                  <p className="mt-2 text-3xl font-semibold">{formatNumber(runtimeDashboard.counts.accounts)}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">Visible rows</p>
                  <p className="mt-2 text-3xl font-semibold">{formatNumber(runtimeDashboard.pins.length)}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">Orders</p>
                  <p className="mt-2 text-3xl font-semibold">{formatNumber(runtimeDashboard.counts.orders)}</p>
                </div>
              </section>

              <section className="overflow-hidden rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-[var(--shadow-soft)]">
                <div className="border-b border-[var(--border-subtle)] p-5">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-[var(--accent-secondary-strong)]" />
                    <h2 className="text-xl font-semibold tracking-[-0.03em]">Accounts</h2>
                  </div>
                </div>
                <div className="divide-y divide-[var(--border-subtle)]">
                  {runtimeDashboard.pins.map((pin) => (
                    <Link
                      key={pin.id}
                      href={orgScopedHref(`/accounts/${pin.id}`, orgSlug)}
                      className="grid gap-4 p-5 transition hover:bg-[var(--surface-elevated)] md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center"
                    >
                      <div>
                        <p className="font-semibold">{pin.name}</p>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          {[pin.city, pin.state].filter(Boolean).join(", ") || "No location"}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-[var(--text-secondary)]">{pin.salesRepNames.join(", ") || "No rep"}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{pin.referralSource || "No referral source"}</p>
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-primary-strong)]">
                        Open
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  ))}
                  {!runtimeDashboard.pins.length ? <div className="p-8 text-sm text-[var(--text-secondary)]">No accounts matched.</div> : null}
                </div>
              </section>
                </>
              );
            })()
          )
        ) : (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 text-sm text-[var(--text-secondary)]">
            No company workspace was found for {orgSlug}.
          </div>
        )}
      </div>
    </AppFrame>
  );
}
