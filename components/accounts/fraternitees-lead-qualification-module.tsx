import Link from "next/link";
import { AlertTriangle, ChevronRight, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import type { TerritoryAccountPin, TerritoryRuntimeDashboard } from "@/lib/domain/runtime";
import { orgScopedHref } from "@/lib/presentation/org-slug";

interface FraterniteesLeadQualificationModuleProps {
  orgSlug: string;
  accounts: TerritoryAccountPin[];
  counts: TerritoryRuntimeDashboard["counts"];
  query: string;
  gradeFilter: string;
  dncFilter: boolean;
  sortBy: string;
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

function normalizeGradeFilter(value: string) {
  return gradeOptions.includes(value as (typeof gradeOptions)[number]) ? value : "All Grades";
}

function normalizeSortOption(value: string) {
  return sortOptions.some((option) => option.value === value) ? value : "score";
}

function accountsFilterHref(input: { orgSlug: string; query?: string; grade?: string; dnc?: boolean; sort?: string }) {
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
  return `/accounts?${params.toString()}`;
}

function accountGrade(account: TerritoryAccountPin) {
  return account.fraterniteesLeadScore?.grade ?? "Unscored";
}

function accountScore(account: TerritoryAccountPin) {
  return account.fraterniteesLeadScore?.score ?? null;
}

function accountCloseRate(account: TerritoryAccountPin) {
  return account.fraterniteesLeadScore?.closeRate ?? null;
}

function accountTotalOrders(account: TerritoryAccountPin) {
  const score = account.fraterniteesLeadScore;
  if (!score) {
    return 0;
  }
  return score.totalOrders ?? score.closedOrders + score.lostOrders + score.openOrders;
}

function isDncFlagged(account: TerritoryAccountPin) {
  const score = account.fraterniteesLeadScore;
  return (score?.lostOrders ?? 0) >= 3;
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

function averageScore(accounts: TerritoryAccountPin[]) {
  const scores = accounts
    .filter((account) => !isDncFlagged(account))
    .map(accountScore)
    .filter((score): score is number => typeof score === "number");

  if (!scores.length) {
    return null;
  }

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function statusLine(account: TerritoryAccountPin) {
  const score = account.fraterniteesLeadScore;
  const contact = [score?.primaryContactName, score?.primaryContactEmail].filter(Boolean).join(" - ");
  const location = [account.city, account.state].filter(Boolean).join(", ");
  return contact || location || score?.priority || "No contact or location saved";
}

export function FraterniteesLeadQualificationModule({
  orgSlug,
  accounts,
  counts,
  query,
  gradeFilter,
  dncFilter,
  sortBy,
}: FraterniteesLeadQualificationModuleProps) {
  const selectedGrade = normalizeGradeFilter(gradeFilter);
  const selectedSort = normalizeSortOption(sortBy);
  const orderedAccounts = [...accounts].sort((left, right) => {
    if (selectedSort === "close_rate") {
      const closeRateDiff = (accountCloseRate(right) ?? -1) - (accountCloseRate(left) ?? -1);
      if (closeRateDiff !== 0) {
        return closeRateDiff;
      }
      const orderCountDiff = accountTotalOrders(right) - accountTotalOrders(left);
      if (orderCountDiff !== 0) {
        return orderCountDiff;
      }
    }

    if (selectedSort === "order_count") {
      const orderCountDiff = accountTotalOrders(right) - accountTotalOrders(left);
      if (orderCountDiff !== 0) {
        return orderCountDiff;
      }
      const closeRateDiff = (accountCloseRate(right) ?? -1) - (accountCloseRate(left) ?? -1);
      if (closeRateDiff !== 0) {
        return closeRateDiff;
      }
    }

    const rightScore = accountScore(right) ?? -1;
    const leftScore = accountScore(left) ?? -1;
    return rightScore - leftScore || left.name.localeCompare(right.name);
  });
  const filteredByDnc = dncFilter ? orderedAccounts.filter(isDncFlagged) : orderedAccounts;
  const visibleAccounts =
    selectedGrade === "All Grades"
      ? filteredByDnc
      : filteredByDnc.filter((account) => accountGrade(account) === selectedGrade);
  const dncCount = orderedAccounts.filter(isDncFlagged).length;
  const avgScore = averageScore(orderedAccounts);
  const connectionHealthy = counts.accounts > 0 && counts.orders > 0;

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
            href={accountsFilterHref({ orgSlug, query, sort: selectedSort, dnc: true })}
            className="border-l-4 border-red-500 bg-white px-4 py-3 transition hover:bg-red-50"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">DNC list count</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{dncCount} Accounts</p>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f26a00]">Total organizations</p>
          <p className="mt-4 text-5xl font-bold tracking-normal text-slate-950">{orderedAccounts.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Avg score (non-DNC)</p>
          <p className="mt-4 text-5xl font-bold tracking-normal text-slate-950">{avgScore ?? "-"}</p>
        </div>
        <Link
          href={accountsFilterHref({ orgSlug, query, dnc: true })}
          className="rounded-lg border border-slate-200 bg-white p-5 transition hover:border-red-200 hover:bg-red-50"
        >
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-red-600">
            DNC flagged
            <AlertTriangle className="h-4 w-4" />
          </p>
          <p className="mt-4 text-5xl font-bold tracking-normal text-red-600">{dncCount}</p>
        </Link>
      </div>

      <form action="/accounts" className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
        <input type="hidden" name="org" value={orgSlug} />
        {dncFilter ? <input type="hidden" name="dnc" value="1" /> : null}
        <label className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search fraternities by name, city, or state..."
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
          />
        </label>
        <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 sm:grid-cols-[auto_1fr] sm:items-center">
          Grade filter
          <select
            name="grade"
            defaultValue={selectedGrade}
            className="min-w-48 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold normal-case tracking-normal text-slate-900 outline-none"
          >
            {gradeOptions.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 sm:grid-cols-[auto_1fr] sm:items-center">
          Sort
          <select
            name="sort"
            defaultValue={selectedSort}
            className="min-w-48 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold normal-case tracking-normal text-slate-900 outline-none"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          style={{ color: "#fff" }}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Apply
        </button>
      </form>

      {dncFilter ? (
        <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span>Showing {visibleAccounts.length} DNC flagged accounts.</span>
          <Link
            href={accountsFilterHref({ orgSlug, query, grade: selectedGrade, sort: selectedSort })}
            className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 text-red-700 ring-1 ring-red-200"
          >
            Show all accounts
          </Link>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="grid grid-cols-[1.5fr_0.8fr_1fr_0.8fr_auto] gap-4 bg-slate-100 px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 max-lg:hidden">
          <p>Organization</p>
          <p>Score</p>
          <p>Orders (close rate)</p>
          <p>AOV</p>
          <p className="sr-only">Open</p>
        </div>
        <div className="divide-y divide-slate-200">
          {visibleAccounts.map((account) => {
            const score = account.fraterniteesLeadScore;
            const grade = accountGrade(account);
            const aov = score?.averageClosedOrderValue ?? score?.medianClosedOrderValue ?? null;
            const totalOrders = accountTotalOrders(account);

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
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-lg text-2xl font-black ring-1 ${gradeClass(grade)}`}>
                    {grade === "Unscored" ? "-" : grade}
                  </span>
                  <p className="text-sm font-semibold text-slate-500">
                    <span className="block text-lg font-bold text-slate-900">{score?.score ?? "-"}</span>
                    pts
                  </p>
                </div>
                <div className="text-sm font-semibold text-slate-600">
                  <p>
                    {totalOrders} total / {score?.closedOrders ?? 0} closed / {score?.lostOrders ?? 0} lost
                  </p>
                  <p className="mt-1 font-bold text-emerald-600">{formatPercent(score?.closeRate)}</p>
                </div>
                <p className="text-lg font-bold text-slate-700">{formatMoney(aov)}</p>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </Link>
            );
          })}
          {!visibleAccounts.length ? (
            <div className="p-6 text-sm font-semibold text-slate-500">No FraterniTees accounts matched this search, grade, and sort selection.</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
