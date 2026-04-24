import Link from "next/link";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import type { FraterniteesAccountDirectoryItem, FraterniteesAccountDirectoryPage } from "@/lib/domain/runtime";
import { FilterToolbar } from "@/components/primitives/filter-toolbar";
import { ScorecardGrid } from "@/components/primitives/scorecard-grid";
import { orgScopedHref } from "@/lib/presentation/org-slug";

interface FraterniteesLeadQualificationModuleProps {
  orgSlug: string;
  directory: FraterniteesAccountDirectoryPage;
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

function accountsFilterHref(input: {
  orgSlug: string;
  query?: string;
  grade?: string;
  dnc?: boolean;
  sort?: string;
  page?: number;
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

export function FraterniteesLeadQualificationModule({
  orgSlug,
  directory,
  gradeOptions: configuredGradeOptions,
  sortOptions: configuredSortOptions,
}: FraterniteesLeadQualificationModuleProps) {
  const { summary, items, filters, pagination } = directory;
  const connectionHealthy = summary.accounts > 0 && summary.orders > 0;
  const resolvedGradeOptions = configuredGradeOptions ?? [...gradeOptions];
  const resolvedSortOptions = configuredSortOptions ?? [...sortOptions];

  return (
    <section className="flex flex-col gap-5 rounded-lg border border-slate-200 bg-[#f7f9fc] p-5 text-slate-950 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">FraterniTees lead qualification</p>
          <h2 className="mt-2 text-4xl font-black uppercase italic tracking-normal text-[#f26a00] md:text-6xl">Scoring Engine</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border-l-4 border-emerald-500 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">API connection</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
              {connectionHealthy ? "Healthy" : "Needs sync"}
            </p>
          </div>
          <Link
            href={accountsFilterHref({
              orgSlug,
              query: filters.query,
              grade: filters.grade,
              sort: filters.sort,
              dnc: true,
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
            href: accountsFilterHref({
              orgSlug,
              query: filters.query,
              grade: filters.grade,
              sort: filters.sort,
              dnc: true,
            }),
          },
        ]}
      />

      <FilterToolbar
        action="/accounts"
        hiddenInputs={[
          { name: "org", value: orgSlug },
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
            href={accountsFilterHref({
              orgSlug,
              query: filters.query,
              grade: filters.grade,
              sort: filters.sort,
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
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-lg text-2xl font-black ring-1 ${gradeClass(account.leadGrade)}`}>
                    {account.leadGrade === "Unscored" ? "-" : account.leadGrade}
                  </span>
                  <p className="text-sm font-semibold text-slate-500">
                    <span className="block text-lg font-bold text-slate-900">{account.leadScore ?? "-"}</span>
                    pts
                  </p>
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
                  ? accountsFilterHref({
                      orgSlug,
                      query: filters.query,
                      grade: filters.grade,
                      sort: filters.sort,
                      dnc: filters.dncOnly,
                      page: pagination.page - 1,
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
                  ? accountsFilterHref({
                      orgSlug,
                      query: filters.query,
                      grade: filters.grade,
                      sort: filters.sort,
                      dnc: filters.dncOnly,
                      page: pagination.page + 1,
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
    </section>
  );
}
