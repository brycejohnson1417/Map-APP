import Link from "next/link";
import { Filter, Home, MapPin, Search, SlidersHorizontal } from "lucide-react";
import type { TerritoryAccountPin, TerritoryRuntimeDashboard } from "@/lib/domain/runtime";

const currencyFormatter = new Intl.NumberFormat("en-US");

function formatNumber(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "None";
  }

  return value;
}

function getFilterHref(flag: TerritoryRuntimeDashboard["appliedFilters"]["flag"]) {
  const params = new URLSearchParams();
  if (flag) {
    params.set("flag", flag);
  }

  return params.size ? `/territory?${params.toString()}` : "/territory";
}

function getRepHref(rep: string) {
  const params = new URLSearchParams();
  params.set("rep", rep);
  return `/territory?${params.toString()}`;
}

function buildPinPlot(pins: TerritoryAccountPin[]) {
  const geocoded = pins.filter((pin) => pin.latitude !== null && pin.longitude !== null);
  const latitudes = geocoded.map((pin) => pin.latitude as number);
  const longitudes = geocoded.map((pin) => pin.longitude as number);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  return geocoded.slice(0, 80).map((pin, index) => {
    const latitude = pin.latitude as number;
    const longitude = pin.longitude as number;
    const top = maxLat === minLat ? 50 : 100 - ((latitude - minLat) / (maxLat - minLat)) * 100;
    const left = maxLng === minLng ? 50 : ((longitude - minLng) / (maxLng - minLng)) * 100;

    return {
      pin,
      index,
      top: Math.min(94, Math.max(6, top)),
      left: Math.min(94, Math.max(6, left)),
    };
  });
}

function StatusPill({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
      {children}
    </span>
  );
}

export function MigratedTerritoryDashboard({ dashboard }: { dashboard: TerritoryRuntimeDashboard }) {
  const plottedPins = buildPinPlot(dashboard.pins);
  const isFiltered = Boolean(dashboard.appliedFilters.search || dashboard.appliedFilters.flag || dashboard.appliedFilters.rep);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[1.5rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">Accounts</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{formatNumber(dashboard.counts.accounts)}</p>
        </div>
        <div className="rounded-[1.5rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">Map Pins</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{formatNumber(dashboard.counts.geocodedPins)}</p>
        </div>
        <div className="rounded-[1.5rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">Orders</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{formatNumber(dashboard.counts.orders)}</p>
        </div>
        <div className="rounded-[1.5rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">Overlays</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
            {formatNumber(dashboard.counts.territoryBoundaries + dashboard.counts.territoryMarkers)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="overflow-hidden rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-[var(--shadow-soft)]">
          <div className="border-b border-[var(--border-subtle)] p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-tertiary)]">Migrated runtime</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Territory pin payload</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                  This view reads the normalized Supabase account table directly. It proves the new app can load territory pins without
                  pulling the old all-purpose CRM payload.
                </p>
              </div>
              <form className="flex w-full flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 sm:flex-row lg:w-auto">
                <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-[var(--surface-card)] px-3 py-2">
                  <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
                  <input
                    name="q"
                    defaultValue={dashboard.appliedFilters.search ?? ""}
                    placeholder="Search account, city, license"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-tertiary)]"
                  />
                </label>
                <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-semibold text-white">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filter
                </button>
              </form>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={getFilterHref(null)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold ${
                  !isFiltered ? "border-[var(--accent-primary)] bg-[rgba(215,67,20,0.1)] text-[var(--accent-primary-strong)]" : "border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]"
                }`}
              >
                <Filter className="h-4 w-4" />
                All pins
              </Link>
              <Link
                href={getFilterHref("missing_referral_source")}
                className={`rounded-full border px-3 py-2 text-sm font-semibold ${
                  dashboard.appliedFilters.flag === "missing_referral_source"
                    ? "border-[var(--accent-primary)] bg-[rgba(215,67,20,0.1)] text-[var(--accent-primary-strong)]"
                    : "border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]"
                }`}
              >
                No Referral Source ({formatNumber(dashboard.counts.noReferralSource)})
              </Link>
              <Link
                href={getFilterHref("missing_sample_delivery")}
                className={`rounded-full border px-3 py-2 text-sm font-semibold ${
                  dashboard.appliedFilters.flag === "missing_sample_delivery"
                    ? "border-[var(--accent-primary)] bg-[rgba(215,67,20,0.1)] text-[var(--accent-primary-strong)]"
                    : "border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]"
                }`}
              >
                No Last Sample Delivery Date ({formatNumber(dashboard.counts.noLastSampleDeliveryDate)})
              </Link>
            </div>
          </div>

          <div className="relative h-[460px] overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(25,88,214,0.18),transparent_34%),linear-gradient(135deg,#f7f2e7,#ece2cf)]">
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(20,18,15,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(20,18,15,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
            <div className="absolute left-5 top-5 rounded-2xl border border-[var(--border-subtle)] bg-[color:color-mix(in_srgb,var(--surface-card)_88%,transparent)] px-4 py-3 text-sm font-semibold shadow-[var(--shadow-soft)] backdrop-blur">
              Showing {formatNumber(dashboard.pins.length)} loaded pins
            </div>
            {plottedPins.map(({ pin, index, top, left }) => (
              <div
                key={pin.id}
                className="group absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                style={{ top: `${top}%`, left: `${left}%` }}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-white shadow-lg ${
                    index % 5 === 0 ? "bg-[#f7d51d]" : index % 3 === 0 ? "bg-[#209365]" : "bg-[var(--accent-primary)]"
                  }`}
                >
                  {pin.leadStatus === "home" ? <Home className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                </div>
                <div className="pointer-events-none absolute bottom-9 hidden min-w-52 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-3 text-xs shadow-[var(--shadow-soft)] group-hover:block">
                  <p className="font-semibold">{pin.name}</p>
                  <p className="mt-1 text-[var(--text-secondary)]">{[pin.city, pin.state].filter(Boolean).join(", ") || "No city"}</p>
                  <p className="mt-1 text-[var(--text-tertiary)]">{pin.salesRepNames.join(", ") || "No rep"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-tertiary)]">Rep facets</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {dashboard.repFacets.length ? (
                dashboard.repFacets.map((rep) => (
                  <Link
                    href={getRepHref(rep.name)}
                    key={rep.name}
                    className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                  >
                    {rep.name} ({rep.count})
                  </Link>
                ))
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">No rep assignments found.</p>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-tertiary)]">Data quality</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-[var(--surface-elevated)] p-4">
                <dt>No Referral Source</dt>
                <dd className="font-semibold">{formatNumber(dashboard.counts.noReferralSource)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[var(--surface-elevated)] p-4">
                <dt>No Last Sample Delivery Date</dt>
                <dd className="font-semibold">{formatNumber(dashboard.counts.noLastSampleDeliveryDate)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[var(--surface-elevated)] p-4">
                <dt>Contacts</dt>
                <dd className="font-semibold">{formatNumber(dashboard.counts.contacts)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-[var(--shadow-soft)]">
        <div className="border-b border-[var(--border-subtle)] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-tertiary)]">Pinned account sample</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Filtered pin rows</h2>
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          {dashboard.pins.slice(0, 24).map((pin) => (
            <div key={pin.id} className="grid gap-4 p-5 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:items-center">
              <div>
                <p className="font-semibold">{pin.name}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{[pin.city, pin.state].filter(Boolean).join(", ") || "No location label"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {pin.status ? <StatusPill>{pin.status}</StatusPill> : null}
                {pin.leadStatus ? <StatusPill>{pin.leadStatus}</StatusPill> : null}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">
                <p className="font-semibold text-[var(--text-primary)]">{pin.salesRepNames.join(", ") || "No rep"}</p>
                <p>{pin.referralSource || "No referral source"}</p>
              </div>
              <div className="text-sm text-[var(--text-secondary)]">
                <p>Last order: {formatDate(pin.lastOrderDate)}</p>
                <p>Sample delivery: {formatDate(pin.lastSampleDeliveryDate)}</p>
              </div>
            </div>
          ))}
          {!dashboard.pins.length ? (
            <div className="p-8 text-sm text-[var(--text-secondary)]">No pins matched the current filters.</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
