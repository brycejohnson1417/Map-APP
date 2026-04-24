import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { FraterniteesLeadTrendSummary } from "@/lib/application/fraternitees/lead-scoring";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatMoney(value: number) {
  return currencyFormatter.format(value);
}

function formatPercent(value: number | null | undefined) {
  return value === null || value === undefined ? "None" : `${Math.round(value * 100)}%`;
}

function trendBadge(summary: FraterniteesLeadTrendSummary) {
  if (summary.direction === "up") {
    return {
      label: summary.delta === null ? "Trending up" : `Trending up (${summary.delta > 0 ? "+" : ""}${summary.delta})`,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: TrendingUp,
    };
  }

  if (summary.direction === "down") {
    return {
      label: summary.delta === null ? "Trending down" : `Trending down (${summary.delta})`,
      className: "border-rose-200 bg-rose-50 text-rose-700",
      icon: TrendingDown,
    };
  }

  if (summary.direction === "flat") {
    return {
      label: summary.delta === null ? "Flat" : `Flat (${summary.delta > 0 ? "+" : ""}${summary.delta})`,
      className: "border-amber-200 bg-amber-50 text-amber-700",
      icon: Minus,
    };
  }

  return {
    label: "Insufficient history",
    className: "border-slate-200 bg-slate-50 text-slate-700",
    icon: Minus,
  };
}

export function TrendSummaryPanel({
  title = "Last 2 years score trend",
  description,
  summary,
}: {
  title?: string;
  description: string;
  summary: FraterniteesLeadTrendSummary;
}) {
  const trendMeta = trendBadge(summary);
  const TrendIcon = trendMeta.icon;

  return (
    <section className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">Trend</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">{description}</p>
        </div>
        <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${trendMeta.className}`}>
          <TrendIcon className="h-4 w-4" />
          {trendMeta.label}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {[summary.current, summary.previous].map((period) => (
          <div
            key={period.label}
            className="rounded-[1.5rem] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{period.label}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {period.startDate} to {period.endDate}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-semibold tracking-[-0.03em]">{period.score ?? "-"}</p>
                <p className="text-sm font-semibold text-[var(--text-secondary)]">{period.grade}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--text-tertiary)]">Close rate</dt>
                <dd className="font-semibold">{formatPercent(period.closeRate)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--text-tertiary)]">Orders</dt>
                <dd className="font-semibold">{period.totalOrders}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--text-tertiary)]">Closed / lost</dt>
                <dd className="font-semibold">
                  {period.closedOrders} / {period.lostOrders}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--text-tertiary)]">Revenue</dt>
                <dd className="font-semibold">{formatMoney(period.closedRevenue)}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
