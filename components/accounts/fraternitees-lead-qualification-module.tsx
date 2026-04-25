import Link from "next/link";
import { ChevronLeft, ChevronRight, Minus, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import type { FraterniteesAccountDirectoryItem, FraterniteesAccountDirectoryPage } from "@/lib/domain/runtime";
import { FilterToolbar } from "@/components/primitives/filter-toolbar";
import { ScorecardGrid } from "@/components/primitives/scorecard-grid";
import { orgScopedHref } from "@/lib/presentation/org-slug";

export type FraterniteesAccountsView = "scoring" | "leaderboard";

interface FraterniteesLeadQualificationModuleProps {
  orgSlug: string;
  directory: FraterniteesAccountDirectoryPage;
  activeView?: FraterniteesAccountsView;
  syncStatus?: {
    lastSuccessfulSyncAt?: string | null;
    lastAttemptedSyncAt?: string | null;
  } | null;
  gradeOptions?: readonly string[];
  sortOptions?: ReadonlyArray<{ value: string; label: string }>;
}

const gradeOptions = ["All Grades", "A+", "A", "B", "C", "D", "F", "Unscored"] as const;
const sortOptions = [
  { value: "score", label: "Top score" },
  { value: "close_rate", label: "Highest close rate" },
  { value: "order_count", label: "Most orders" },
] as const;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatMoney(value: number | null | undefined) {
  return value === null || value === undefined ? "-" : currencyFormatter.format(value);
}

function formatPercent(value: number | null | undefined) {
  return value === null || value === undefined ? "N/A" : `${Math.round(value * 100)}%`;
}

function formatDate(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "None";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function accountsPageHref(input: {
  orgSlug: string;
  query?: string;
  grade?: string;
  dnc?: boolean;
  sort?: string;
  page?: number;
  view?: FraterniteesAccountsView;
}) {
  const params = new URLSearchParams({ org: input.orgSlug });
  if (input.query?.trim()) {
    params.set("q", input.query.trim());
  }
  if (input.grade && input.grade !== "All Grades") {
    params.set("grade", input.grade);
  }
  if (input.sort && input.sort !== "score") {
    params.set("sort", input.sort);
  }
  if (input.dnc) {
    params.set("dnc", "1");
  }
  if (input.page && input.page > 1) {
    params.set("page", String(input.page));
  }
  if (input.view && input.view !== "scoring") {
    params.set("view", input.view);
  }
  return `/accounts?${params.toString()}`;
}

function gradeClass(grade: string) {
  if (grade === "A+") {
    return "bg-emerald-100 text-emerald-800 ring-emerald-300";
  }
  if (grade === "A") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (grade === "B") {
    return "bg-blue-50 text-blue-700 ring-blue-200";
  }
  if (grade === "C") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }
  if (grade === "D") {
    return "bg-red-50 text-red-700 ring-red-200";
  }
  if (grade === "F") {
    return "bg-rose-100 text-rose-700 ring-rose-300";
  }

  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function statusLine(account: FraterniteesAccountDirectoryItem) {
  const contact = [account.primaryContactName, account.primaryContactEmail].filter(Boolean).join(" - ");
  const location = [account.city, account.state].filter(Boolean).join(", ");
  return contact || location || account.leadPriority || "No contact or location saved";
}

function scoreTrendMeta(account: FraterniteesAccountDirectoryItem) {
  if (!account.scoreTrend) {
    return {
      label: "No trend yet",
      className: "border-slate-200 bg-slate-50 text-slate-500",
      icon: Minus,
    };
  }

  const delta = account.scoreTrend.delta;
  if (account.scoreTrend.direction === "up") {
    return {
      label: delta === null ? "Trending up" : `Trending up ${delta > 0 ? "+" : ""}${delta}`,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: TrendingUp,
    };
  }

  if (account.scoreTrend.direction === "down") {
    return {
      label: delta === null ? "Trending down" : `Trending down ${delta}`,
      className: "border-rose-200 bg-rose-50 text-rose-700",
      icon: TrendingDown,
    };
  }

  if (account.scoreTrend.direction === "flat") {
    return {
      label: delta === null ? "Flat" : `Flat ${delta > 0 ? "+" : ""}${delta}`,
      className: "border-amber-200 bg-amber-50 text-amber-700",
      icon: Minus,
    };
  }

  return {
    label: "Insufficient history",
    className: "border-slate-200 bg-slate-50 text-slate-500",
    icon: Minus,
  };
}

function LeaderboardSection({
  orgSlug,
  topCustomersLast12Months,
}: {
  orgSlug: string;
  topCustomersLast12Months: FraterniteesAccountDirectoryPage["topCustomersLast12Months"];
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Top 100 customers</p>
          <h3 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-950">Trailing 12-month spend</h3>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          Closed Printavo orders from the last 12 months, ranked by spend so FraterniTees can protect the next merch-chair handoff.
        </p>
      </div>
      <div className="max-h-[32rem] overflow-auto">
        <div className="grid grid-cols-[1.6fr_0.7fr_0.7fr_0.8fr] gap-3 bg-slate-100 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 max-md:hidden">
          <p>Organization</p>
          <p>Spend</p>
          <p>Closed orders</p>
          <p>Last order</p>
        </div>
        <div className="divide-y divide-slate-200">
          {topCustomersLast12Months.map((account, index) => (
            <Link
              key={account.accountId}
              href={orgScopedHref(`/accounts/${account.accountId}`, orgSlug)}
              className="grid gap-3 px-5 py-4 transition hover:bg-slate-50 md:grid-cols-[1.6fr_0.7fr_0.7fr_0.8fr] md:items-center"
            >
              <div className="min-w-0">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-slate-950 px-2 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-slate-950">{account.name}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {[account.city, account.state].filter(Boolean).join(", ") || "No location"} / Score {account.leadScore ?? "-"} ({account.leadGrade})
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 md:hidden">Spend</p>
                <p className="text-lg font-bold text-slate-900">{formatMoney(account.closedRevenueLast12)}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 md:hidden">Closed orders</p>
                <p className="text-sm font-semibold text-slate-700">
                  {account.closedOrdersLast12} / {formatPercent(account.closeRate)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 md:hidden">Last order</p>
                <p className="text-sm font-semibold text-slate-700">{formatDate(account.lastOrderDate)}</p>
              </div>
            </Link>
          ))}
          {!topCustomersLast12Months.length ? (
            <div className="px-5 py-6 text-sm font-semibold text-slate-500">
              No closed orders from the last 12 months are available yet.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ScoringSection({
  orgSlug,
  directory,
  resolvedGradeOptions,
  resolvedSortOptions,
}: {
  orgSlug: string;
  directory: FraterniteesAccountDirectoryPage;
  resolvedGradeOptions: readonly string[];
  resolvedSortOptions: ReadonlyArray<{ value: string; label: string }>;
}) {
  const { items, filters, pagination } = directory;

  return (
    <>
      <FilterToolbar
        action="/accounts"
        hiddenInputs={[
          { name: "org", value: orgSlug },
          { name: "view", value: "scoring" },
          ...(filters.dncOnly ? [{ name: "dnc", value: "1" }] : []),
        ]}
        queryValue={filters.query}
        queryPlaceholder="Search fraternities by name, city, state, or contact..."
        selects={[
          {
            name: "grade",
            label: "Grade filter",
            value: filters.grade,
            options: resolvedGradeOptions.map((grade) => ({ value: grade, label: grade })),
          },
          {
            name: "sort",
            label: "Sort",
            value: filters.sort,
            options: resolvedSortOptions.map((option) => ({ value: option.value, label: option.label })),
          },
        ]}
      />

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing {pagination.startItem}-{pagination.endItem} of {pagination.totalItems} matching accounts.
        </span>
        {filters.dncOnly ? (
          <Link
            href={accountsPageHref({
              orgSlug,
              query: filters.query,
              grade: filters.grade,
              sort: filters.sort,
              view: "scoring",
            })}
            className="inline-flex items-center justify-center rounded-lg bg-red-50 px-3 py-2 text-red-700 ring-1 ring-red-200"
          >
            Show all accounts
          </Link>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="grid grid-cols-[1.5fr_0.8fr_1fr_0.8fr_auto] gap-4 bg-slate-100 px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 max-lg:hidden">
          <p>Organization</p>
          <p>Score</p>
          <p>Orders (close rate)</p>
          <p>AOV</p>
          <p className="sr-only">Open</p>
        </div>
        <div className="divide-y divide-slate-200">
          {items.map((account) => {
            const aov = account.averageClosedOrderValue ?? account.medianClosedOrderValue ?? null;
            const trendMeta = scoreTrendMeta(account);
            const TrendIcon = trendMeta.icon;

            return (
              <Link
                key={account.id}
                href={orgScopedHref(`/accounts/${account.id}`, orgSlug)}
                className="grid gap-4 px-5 py-5 transition hover:bg-slate-50 lg:grid-cols-[1.5fr_0.8fr_1fr_0.8fr_auto] lg:items-center"
              >
                <div>
                  <p className="text-xl font-bold tracking-normal text-slate-950">{account.name}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{statusLine(account)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-lg text-2xl font-black ring-1 ${gradeClass(account.leadGrade)}`}
                  >
                    {account.leadGrade === "Unscored" ? "-" : account.leadGrade}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      <span className="block text-lg font-bold text-slate-900">{account.leadScore ?? "-"}</span>
                      pts
                    </p>
                    <span
                      className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${trendMeta.className}`}
                    >
                      <TrendIcon className="h-3.5 w-3.5" />
                      {trendMeta.label}
                    </span>
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-600">
                  <p>
                    {account.totalOrders} total / {account.closedOrders} closed / {account.lostOrders} lost
                  </p>
                  <p className="mt-1 font-bold text-emerald-600">{formatPercent(account.closeRate)}</p>
                </div>
                <p className="text-lg font-bold text-slate-700">{formatMoney(aov)}</p>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </Link>
            );
          })}
          {!items.length ? (
            <div className="p-6 text-sm font-semibold text-slate-500">No FraterniTees accounts matched this search, grade, and sort selection.</div>
          ) : null}
        </div>
      </div>

      {pagination.totalPages > 1 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Link
              aria-disabled={!pagination.hasPreviousPage}
              href={
                pagination.hasPreviousPage
                  ? accountsPageHref({
                      orgSlug,
                      query: filters.query,
                      grade: filters.grade,
                      sort: filters.sort,
                      dnc: filters.dncOnly,
                      page: pagination.page - 1,
                      view: "scoring",
                    })
                  : "#"
              }
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold ${
                pagination.hasPreviousPage
                  ? "border-slate-200 bg-white text-slate-900"
                  : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Link>
            <Link
              aria-disabled={!pagination.hasNextPage}
              href={
                pagination.hasNextPage
                  ? accountsPageHref({
                      orgSlug,
                      query: filters.query,
                      grade: filters.grade,
                      sort: filters.sort,
                      dnc: filters.dncOnly,
                      page: pagination.page + 1,
                      view: "scoring",
                    })
                  : "#"
              }
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold ${
                pagination.hasNextPage
                  ? "border-slate-200 bg-white text-slate-900"
                  : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
              }`}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function FraterniteesLeadQualificationModule({
  orgSlug,
  directory,
  activeView = "scoring",
  syncStatus,
  gradeOptions: configuredGradeOptions,
  sortOptions: configuredSortOptions,
}: FraterniteesLeadQualificationModuleProps) {
  const { summary, filters } = directory;
  const connectionHealthy = summary.accounts > 0 && summary.orders > 0;
  const resolvedGradeOptions = configuredGradeOptions ?? [...gradeOptions];
  const resolvedSortOptions = configuredSortOptions ?? [...sortOptions];
  const activeTabTitle = activeView === "leaderboard" ? "Account Leaderboard" : "Scoring Engine";

  return (
    <section className="flex flex-col gap-5 rounded-lg border border-slate-200 bg-[#f7f9fc] p-5 text-slate-950 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">FraterniTees account intelligence</p>
          <h2 className="mt-2 text-4xl font-black uppercase italic tracking-normal text-[#f26a00] md:text-6xl">{activeTabTitle}</h2>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
            Switch between the live scoring workflow and the trailing 12-month customer leaderboard without stacking both sections on the page.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border-l-4 border-emerald-500 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">API connection</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
              {connectionHealthy ? "Healthy" : "Needs sync"}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Last sync: {formatDateTime(syncStatus?.lastSuccessfulSyncAt ?? syncStatus?.lastAttemptedSyncAt ?? null)}
            </p>
          </div>
          <Link
            href={accountsPageHref({
              orgSlug,
              query: filters.query,
              grade: filters.grade,
              sort: filters.sort,
              dnc: true,
              view: "scoring",
            })}
            className="border-l-4 border-red-500 bg-white px-4 py-3 transition hover:bg-red-50"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">DNC list count</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{summary.dncFlaggedAccounts} Accounts</p>
          </Link>
        </div>
      </div>

      <ScorecardGrid
        items={[
          {
            id: "total-organizations",
            label: "Total organizations",
            value: String(summary.accounts),
            accentClassName: "text-[#f26a00]",
          },
          {
            id: "avg-score",
            label: "Avg score (non-DNC)",
            value: summary.avgScoreNonDnc === null ? "-" : String(summary.avgScoreNonDnc),
            accentClassName: "text-emerald-600",
          },
          {
            id: "dnc-flagged",
            label: "DNC flagged",
            value: String(summary.dncFlaggedAccounts),
            accentClassName: "text-red-600",
            href: accountsPageHref({
              orgSlug,
              query: filters.query,
              grade: filters.grade,
              sort: filters.sort,
              dnc: true,
              view: "scoring",
            }),
          },
        ]}
      />

      <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        <div role="tablist" aria-label="FraterniTees accounts sections" className="grid gap-2 md:grid-cols-2">
          <Link
            href={accountsPageHref({
              orgSlug,
              query: filters.query,
              grade: filters.grade,
              sort: filters.sort,
              dnc: filters.dncOnly,
              page: paginationNeedsRetention(directory) ? directory.pagination.page : undefined,
              view: "scoring",
            })}
            role="tab"
            aria-selected={activeView === "scoring"}
            className={`flex min-h-20 flex-col justify-center rounded-md px-4 py-3 text-left transition ${
              activeView === "scoring"
                ? "border border-[#f26a00]/30 bg-[#fff4eb] text-slate-950 shadow-sm ring-1 ring-[#f26a00]/20"
                : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.24em] opacity-70">Tab</span>
            <span className="mt-1 text-lg font-bold tracking-[-0.02em]">Scoring Engine</span>
            <span className={`mt-1 text-sm ${activeView === "scoring" ? "text-slate-600" : "text-slate-500"}`}>
              Lead grades, filters, and the account call sheet.
            </span>
          </Link>
          <Link
            href={accountsPageHref({
              orgSlug,
              query: filters.query,
              grade: filters.grade,
              sort: filters.sort,
              dnc: filters.dncOnly,
              view: "leaderboard",
            })}
            role="tab"
            aria-selected={activeView === "leaderboard"}
            className={`flex min-h-20 flex-col justify-center rounded-md px-4 py-3 text-left transition ${
              activeView === "leaderboard"
                ? "border border-[#f26a00]/30 bg-[#fff4eb] text-slate-950 shadow-sm ring-1 ring-[#f26a00]/20"
                : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.24em] opacity-70">Tab</span>
            <span className="mt-1 text-lg font-bold tracking-[-0.02em]">Account Leaderboard</span>
            <span className={`mt-1 text-sm ${activeView === "leaderboard" ? "text-slate-600" : "text-slate-500"}`}>
              Top 100 customers by trailing 12-month spend.
            </span>
          </Link>
        </div>
      </div>

      {activeView === "leaderboard" ? (
        <LeaderboardSection orgSlug={orgSlug} topCustomersLast12Months={directory.topCustomersLast12Months} />
      ) : (
        <ScoringSection
          orgSlug={orgSlug}
          directory={directory}
          resolvedGradeOptions={resolvedGradeOptions}
          resolvedSortOptions={resolvedSortOptions}
        />
      )}
    </section>
  );
}

function paginationNeedsRetention(directory: FraterniteesAccountDirectoryPage) {
  const { filters, pagination } = directory;
  return Boolean(
    pagination.page > 1 ||
      filters.query ||
      filters.grade !== "All Grades" ||
      filters.sort !== "score" ||
      filters.dncOnly,
  );
}
