import "server-only";

import { isConnectorSecretEnvelopeConfigured, isSupabaseConfigured } from "@/lib/supabase/config";

function getRuntimeHealthSnapshot() {
  return {
    ok: true,
    runtime: "supabase-first",
    supabaseConfigured: isSupabaseConfigured(),
    connectorSecretEnvelopeConfigured: isConnectorSecretEnvelopeConfigured(),
    checkedAt: new Date().toISOString(),
  };
}

export function RuntimeStatusPanel() {
  const health = getRuntimeHealthSnapshot();

  return (
    <aside className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-tertiary)]">Runtime status</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Health snapshot</h2>
        </div>
        <div className={`h-3 w-3 rounded-full ${health.ok ? "bg-[var(--accent-success)]" : "bg-[var(--accent-danger)]"}`} />
      </div>
      <dl className="mt-6 space-y-4 text-sm">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">Runtime</dt>
          <dd className="mt-2 text-base font-semibold">{health.runtime}</dd>
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">Supabase config</dt>
          <dd className="mt-2 text-base font-semibold">{health.supabaseConfigured ? "present" : "missing"}</dd>
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">Secret envelope</dt>
          <dd className="mt-2 text-base font-semibold">
            {health.connectorSecretEnvelopeConfigured ? "present" : "missing"}
          </dd>
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">Checked at</dt>
          <dd className="mt-2 text-base font-semibold">{health.checkedAt}</dd>
        </div>
      </dl>
    </aside>
  );
}
