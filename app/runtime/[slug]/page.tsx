import { notFound } from "next/navigation";
import { Activity, AlertTriangle, CheckCircle2, Clock3, DatabaseZap, RefreshCw, ShieldCheck } from "lucide-react";
import { AppFrame } from "@/components/layout/app-frame";
import { getOrganizationRuntimeSnapshot } from "@/lib/application/runtime/organization-service";
import type { AuditEvent, SyncCursor, SyncJob, SyncStatus } from "@/lib/domain/runtime";

export const dynamic = "force-dynamic";

interface RuntimePageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

async function resolveParams(params: RuntimePageProps["params"]) {
  return Promise.resolve(params);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "None";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatPayloadLabel(payload: Record<string, unknown>) {
  const action = payload.action;
  if (typeof action === "string" && action.trim()) {
    return action.replaceAll("_", " ");
  }

  const reason = payload.reason;
  if (typeof reason === "string" && reason.trim()) {
    return reason.replaceAll("_", " ");
  }

  return "Runtime event";
}

function syncStatusClass(status: SyncStatus) {
  if (status === "success") {
    return "bg-[rgba(32,147,101,0.12)] text-[var(--accent-success)]";
  }
  if (status === "error") {
    return "bg-[rgba(213,62,42,0.12)] text-[var(--accent-danger)]";
  }
  if (status === "running" || status === "queued") {
    return "bg-[var(--accent-secondary-soft)] text-[var(--accent-secondary-strong)]";
  }
  return "bg-[var(--surface-card)] text-[var(--text-tertiary)]";
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Activity }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">{label}</p>
        <Icon className="h-4 w-4 text-[var(--accent-secondary-strong)]" />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
    </div>
  );
}

function SyncJobRow({ job }: { job: SyncJob }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-semibold">{job.kind.replaceAll("_", " ")}</p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">{formatDateTime(job.createdAt)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${syncStatusClass(job.status)}`}>
          {job.status}
        </span>
      </div>
      {job.lastError ? <p className="mt-3 text-sm text-[var(--accent-danger)]">{job.lastError}</p> : null}
      {job.dedupeKey ? <p className="mt-3 truncate text-xs text-[var(--text-tertiary)]">{job.dedupeKey}</p> : null}
    </div>
  );
}

function SyncCursorRow({ cursor }: { cursor: SyncCursor }) {
  const lastEvent = cursor.lastAttemptedSyncAt ?? cursor.lastSuccessfulSyncAt;

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-semibold">
            {cursor.provider} / {cursor.scope}
          </p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Last success: {formatDateTime(cursor.lastSuccessfulSyncAt)}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${syncStatusClass(cursor.status)}`}>
          {cursor.status}
        </span>
      </div>
      {cursor.lastError ? <p className="mt-3 text-sm text-[var(--accent-danger)]">{cursor.lastError}</p> : null}
      <p className="mt-3 text-xs text-[var(--text-tertiary)]">Last attempt: {formatDateTime(lastEvent)}</p>
    </div>
  );
}

function AuditEventRow({ event }: { event: AuditEvent }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-semibold">{event.eventType.replaceAll("_", " ")}</p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            {event.entityType} / {formatPayloadLabel(event.payload)}
          </p>
        </div>
        <span className="shrink-0 text-xs font-semibold text-[var(--text-tertiary)]">{formatDateTime(event.createdAt)}</span>
      </div>
      <p className="mt-3 truncate text-xs text-[var(--text-tertiary)]">{event.entityId}</p>
    </div>
  );
}

export default async function RuntimePage({ params }: RuntimePageProps) {
  const { slug } = await resolveParams(params);
  const snapshot = await getOrganizationRuntimeSnapshot(slug);

  if (!snapshot) {
    notFound();
  }

  const syncJobTotal = snapshot.syncJobStatusCounts.reduce((sum, entry) => sum + entry.count, 0);
  const openSyncJobs = snapshot.syncJobStatusCounts
    .filter((entry) => entry.status === "queued" || entry.status === "running")
    .reduce((sum, entry) => sum + entry.count, 0);
  const historicalSyncErrors = snapshot.syncJobStatusCounts.find((entry) => entry.status === "error")?.count ?? 0;
  const currentSyncErrors = snapshot.syncCursors.filter((cursor) => cursor.status === "error").length;
  const currentSyncHealth = snapshot.syncCursors.length === 0 ? "No cursors" : currentSyncErrors ? `${currentSyncErrors} error${currentSyncErrors === 1 ? "" : "s"}` : "Healthy";

  return (
    <AppFrame organizationName={snapshot.organization.name} organizationSlug={snapshot.organization.slug}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
        <header className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-secondary-strong)]">
            Runtime
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
            {snapshot.organization.name}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Organization slug: <span className="font-semibold">{snapshot.organization.slug}</span>
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-5">
          <MetricCard label="Integrations" value={String(snapshot.integrations.length)} icon={DatabaseZap} />
          <MetricCard label="Sync jobs" value={String(syncJobTotal)} icon={RefreshCw} />
          <MetricCard label="Sync health" value={currentSyncHealth} icon={CheckCircle2} />
          <MetricCard label="Open queue" value={String(openSyncJobs)} icon={Clock3} />
          <MetricCard label="Audit events" value={String(snapshot.recentAuditEvents.length)} icon={ShieldCheck} />
        </section>

        {currentSyncErrors ? (
          <div className="flex items-center gap-3 rounded-2xl border border-[rgba(213,62,42,0.22)] bg-[rgba(213,62,42,0.08)] p-4 text-sm font-semibold text-[var(--accent-danger)]">
            <AlertTriangle className="h-4 w-4" />
            {currentSyncErrors} sync source{currentSyncErrors === 1 ? "" : "s"} currently reporting an error.
          </div>
        ) : null}
        {!currentSyncErrors && historicalSyncErrors && snapshot.syncCursors.length ? (
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 text-sm font-semibold text-[var(--text-secondary)]">
            <CheckCircle2 className="h-4 w-4 text-[var(--accent-success)]" />
            {historicalSyncErrors} historical sync job{historicalSyncErrors === 1 ? "" : "s"} failed earlier, but the latest sync cursors are healthy.
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3">
              <DatabaseZap className="h-5 w-5 text-[var(--accent-secondary-strong)]" />
              <h2 className="text-lg font-semibold">Integrations</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {snapshot.integrations.length === 0 ? (
                <p className="text-[var(--text-tertiary)]">No integrations yet.</p>
              ) : (
                snapshot.integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{integration.displayName}</p>
                      <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                        {integration.provider}
                      </span>
                    </div>
                    <p className="mt-2 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[var(--accent-success)]" />
                      <span className="font-semibold">{integration.status}</span>
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 border-t border-[var(--border-subtle)] pt-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[var(--accent-success)]" />
                <h2 className="text-lg font-semibold">Current sync health</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                {snapshot.syncCursors.length === 0 ? (
                  <p className="text-[var(--text-tertiary)]">No sync cursors recorded yet.</p>
                ) : (
                  snapshot.syncCursors.map((cursor) => <SyncCursorRow key={cursor.id} cursor={cursor} />)
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-[var(--accent-primary)]" />
              <h2 className="text-lg font-semibold">Recent sync jobs</h2>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {snapshot.syncJobStatusCounts.map((entry) => (
                <span key={entry.status} className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${syncStatusClass(entry.status)}`}>
                  {entry.status}: {entry.count}
                </span>
              ))}
              {!snapshot.syncJobStatusCounts.length ? (
                <span className="rounded-full bg-[var(--surface-elevated)] px-3 py-2 text-xs font-semibold text-[var(--text-tertiary)]">
                  No jobs yet
                </span>
              ) : null}
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {snapshot.recentSyncJobs.length === 0 ? (
                <p className="text-[var(--text-tertiary)]">No sync jobs recorded yet.</p>
              ) : (
                snapshot.recentSyncJobs.map((job) => <SyncJobRow key={job.id} job={job} />)
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-[var(--accent-success)]" />
            <h2 className="text-lg font-semibold">Recent audit events</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {snapshot.recentAuditEvents.length ? (
              snapshot.recentAuditEvents.map((event) => <AuditEventRow key={event.id} event={event} />)
            ) : (
              <p className="text-sm text-[var(--text-tertiary)]">No audit events recorded yet.</p>
            )}
          </div>
        </section>
      </div>
    </AppFrame>
  );
}
