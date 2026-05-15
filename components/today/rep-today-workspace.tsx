import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, DatabaseZap, MapPinned, Route, Sparkles, TriangleAlert } from "lucide-react";
import type { RepTodayAction, RepTodaySummary } from "@/lib/application/runtime/rep-today-service";

const toneClasses: Record<RepTodayAction["tone"], string> = {
  red: "border-red-200 bg-red-50 text-red-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
};

function statusLabel(action: RepTodayAction) {
  if (action.status === "needs_setup") {
    return "Setup required";
  }
  if (action.status === "ready") {
    return action.count > 0 ? `${action.count} ready` : "Ready";
  }
  return "Nothing due";
}

function StatusIcon({ status }: { status: RepTodayAction["status"] }) {
  if (status === "needs_setup") {
    return <TriangleAlert className="h-4 w-4" />;
  }
  if (status === "ready") {
    return <CheckCircle2 className="h-4 w-4" />;
  }
  return <Circle className="h-4 w-4" />;
}

export function RepTodayWorkspace({ summary }: { summary: RepTodaySummary }) {
  if (summary.isEmpty) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6 md:py-10">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-blue-700">
            <DatabaseZap className="h-5 w-5" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Rep Today</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">Connect data before working today.</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
            {summary.organizationName} does not have account data yet. Connect or import the first CRM, order, social, or spreadsheet source so the daily workspace can prioritize real actions.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={summary.setupHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              style={{ color: "#fff" }}
            >
              Import first account data
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 md:px-10 md:py-10">
      <header className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
              {summary.tenantLabel}
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">Rep Today</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              A mobile-first work queue for {summary.organizationName}: reorder signals, quote follow-up, route mode, data cleanup, and source-linking actions in one place.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={summary.actions.find((action) => action.id === "route")?.href ?? summary.setupHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold"
            >
              <MapPinned className="h-4 w-4" />
              Open route mode
            </Link>
            <Link
              href={summary.setupHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
              style={{ color: "#fff" }}
            >
              <DatabaseZap className="h-4 w-4" />
              Link source systems
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary.metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
            <p className="mt-1 text-sm text-slate-600">{metric.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex items-center gap-3">
            <Route className="h-5 w-5 text-blue-700" />
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Today's actions</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {summary.actions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-400"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses[action.tone]}`}>
                        <StatusIcon status={action.status} />
                        {statusLabel(action)}
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em]">{action.title}</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">{action.body}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-blue-700">
                    {action.label}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-blue-700" />
            <h2 className="text-xl font-semibold tracking-[-0.03em]">Completion logic</h2>
          </div>
          <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
            <p>
              Each card is intentionally actionable: it links to the page where the rep can finish the job, not a passive dashboard.
            </p>
            <p>
              Empty cards stay visible as completion states, so reps know when a queue is clean instead of wondering whether the app failed to load data.
            </p>
          </div>
        </aside>
      </section>
    </section>
  );
}
