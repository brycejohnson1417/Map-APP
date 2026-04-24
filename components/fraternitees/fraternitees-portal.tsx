"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  DatabaseZap,
  ListChecks,
  KeyRound,
  Loader2,
  LogOut,
  MapPinned,
  PlugZap,
  ShieldCheck,
} from "lucide-react";
import { FRATERNITEES_STATUS_FILTERS, type FraterniteesLeadScore } from "@/lib/application/fraternitees/lead-scoring";
import {
  resolveTenantPluginSettings,
  type TenantPluginKey,
  type TenantPluginSettings,
} from "@/lib/application/runtime/plugin-settings";

interface IntegrationSummary {
  id: string;
  provider: string;
  displayName: string;
  externalAccountId: string | null;
  status: string;
  updatedAt: string;
}

interface FraterniteesWorkspaceProps {
  orgSlug: string;
  workspaceName: string;
  sessionEmail: string;
  integrations: IntegrationSummary[];
  pluginSettings?: TenantPluginSettings;
  setupError?: string | null;
}

interface PreviewState {
  source: "printavo";
  label: string;
  rawCount: number;
  mappedCount: number;
  scores: FraterniteesLeadScore[];
}

interface PrintavoSyncStatus {
  accounts: number;
  orders: number;
  backfill?: {
    hasMore?: boolean;
    completed?: boolean;
    fetchedOrders?: number;
    pagesFetched?: number;
    rateLimited?: boolean;
    retryAfterSeconds?: number | null;
    updatedAt?: string;
  };
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat("en-US");
const BACKFILL_PAGE_LIMIT = 20;
const BACKFILL_BATCH_DELAY_MS = 2_500;
const BACKFILL_MAX_BATCHES = 320;
const DEFAULT_RATE_LIMIT_WAIT_SECONDS = 45;

const fraterniteesTheme = {
  "--background": "#f5f7fb",
  "--surface-card": "#ffffff",
  "--surface-elevated": "#eef3f8",
  "--text-primary": "#151923",
  "--text-secondary": "#4b5565",
  "--text-tertiary": "#727c8d",
  "--border-subtle": "rgba(23, 31, 45, 0.1)",
  "--border-strong": "rgba(23, 31, 45, 0.2)",
  "--accent-primary": "#e2472f",
  "--accent-primary-strong": "#bd321f",
  "--accent-secondary-soft": "rgba(36, 103, 221, 0.12)",
  "--accent-secondary-strong": "#2467dd",
  "--accent-success": "#15825f",
  "--accent-danger": "#d53e2a",
  "--shadow-soft": "0 22px 60px rgba(28, 39, 58, 0.1)",
} as CSSProperties;

function formatMoney(value: number) {
  return currencyFormatter.format(value);
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatPercent(value: number | null) {
  return value === null ? "No terminal outcomes" : `${Math.round(value * 100)}%`;
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function priorityClass(priority: FraterniteesLeadScore["priority"]) {
  if (priority === "Priority") {
    return "bg-[rgba(32,147,101,0.12)] text-[var(--accent-success)]";
  }
  if (priority === "Do Not Contact review") {
    return "bg-[rgba(213,62,42,0.12)] text-[var(--accent-danger)]";
  }
  if (priority === "Watch") {
    return "bg-[rgba(215,67,20,0.12)] text-[var(--accent-primary-strong)]";
  }
  return "bg-[var(--accent-secondary-soft)] text-[var(--accent-secondary-strong)]";
}

function PluginToggle({
  label,
  description,
  enabled,
  disabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
      <div className="min-w-0">
        <p className="font-semibold">{label}</p>
        <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={onToggle}
        className={classNames(
          "relative h-7 w-12 shrink-0 rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60",
          enabled
            ? "border-[var(--accent-success)] bg-[var(--accent-success)]"
            : "border-[var(--border-strong)] bg-[var(--surface-card)]",
        )}
      >
        <span
          className={classNames(
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition",
            enabled ? "left-6" : "left-1",
          )}
        />
      </button>
    </div>
  );
}

function ScoreTable({ preview }: { preview: PreviewState | null }) {
  if (!preview) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-card)] p-8 text-sm text-[var(--text-secondary)]">
        Run a live Printavo preview to generate close-rate scores.
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-[var(--shadow-soft)]">
      <div className="flex flex-col justify-between gap-3 border-b border-[var(--border-subtle)] p-5 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">{preview.source}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">{preview.label}</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-[var(--text-secondary)]">
          <span className="rounded-full bg-[var(--surface-elevated)] px-3 py-2">{preview.rawCount} raw rows</span>
          <span className="rounded-full bg-[var(--surface-elevated)] px-3 py-2">{preview.mappedCount} mapped orders</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-[var(--surface-elevated)] text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
            <tr>
              <th className="px-5 py-3">Account</th>
              <th className="px-5 py-3">Score</th>
              <th className="px-5 py-3">Priority</th>
              <th className="px-5 py-3">Close rate</th>
              <th className="px-5 py-3">Closed/lost</th>
              <th className="px-5 py-3">Median order</th>
              <th className="px-5 py-3">Months</th>
              <th className="px-5 py-3">Last order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {preview.scores.map((score) => (
              <tr key={score.customerName} className="align-top">
                <td className="px-5 py-4">
                  <p className="font-semibold">{score.customerName}</p>
                  <p className="mt-1 max-w-md text-xs leading-5 text-[var(--text-tertiary)]">{score.reasons.slice(0, 2).join(" / ")}</p>
                </td>
                <td className="px-5 py-4 text-xl font-semibold">{score.score}</td>
                <td className="px-5 py-4">
                  <span className={classNames("rounded-full px-3 py-1.5 text-xs font-semibold", priorityClass(score.priority))}>
                    {score.priority}
                  </span>
                </td>
                <td className="px-5 py-4 font-semibold">{formatPercent(score.closeRate)}</td>
                <td className="px-5 py-4">
                  {score.closedOrders}/{score.lostOrders}
                  {score.ghostOrHardLosses ? (
                    <p className="mt-1 text-xs text-[var(--accent-danger)]">{score.ghostOrHardLosses} hard losses</p>
                  ) : null}
                </td>
                <td className="px-5 py-4">{formatMoney(score.medianClosedOrderValue)}</td>
                <td className="px-5 py-4">{score.monthsWithClosedOrdersLast12}</td>
                <td className="px-5 py-4">{score.lastOrderDate ?? "None"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!preview.scores.length ? (
        <div className="p-8 text-sm text-[var(--text-secondary)]">
          No scored accounts yet. Make sure the data includes a customer/company column and a status column.
        </div>
      ) : null}
    </section>
  );
}

export function FraterniteesLoginForm() {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/tenants/fraternitees/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Login failed");
      }
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={fraterniteesTheme} className="min-h-screen bg-[var(--background)] px-5 py-8 text-[var(--text-primary)] md:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center">
        <section className="w-full rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)] md:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent-primary)] text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-secondary-strong)]">
            FraterniTees workspace
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
            Connect the chapter CRM and Printavo order history.
          </h1>
          <form onSubmit={submit} className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3">
              <KeyRound className="h-4 w-4 text-[var(--text-tertiary)]" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@fraternitees.com"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[var(--text-tertiary)]"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              style={{ color: "#fff" }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Continue
            </button>
          </form>
          {error ? <p className="mt-4 text-sm font-semibold text-[var(--accent-danger)]">{error}</p> : null}
        </section>
      </div>
    </main>
  );
}

export function FraterniteesWorkspace({
  orgSlug,
  workspaceName,
  sessionEmail,
  integrations,
  pluginSettings,
  setupError,
}: FraterniteesWorkspaceProps) {
  const savedPrintavoEmail = integrations.find((integration) => integration.provider === "printavo")?.externalAccountId ?? sessionEmail;
  const [printavoEmail, setPrintavoEmail] = useState(savedPrintavoEmail);
  const [printavoApiKey, setPrintavoApiKey] = useState("");
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [liveStatuses, setLiveStatuses] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(setupError ?? null);
  const [connected, setConnected] = useState(integrations);
  const [syncStatus, setSyncStatus] = useState<PrintavoSyncStatus | null>(null);
  const [plugins, setPlugins] = useState<TenantPluginSettings>(
    pluginSettings ?? resolveTenantPluginSettings(orgSlug, {}),
  );

  const connectedProviders = useMemo(() => new Set(connected.map((integration) => integration.provider)), [connected]);
  const hasSavedPrintavo = connectedProviders.has("printavo");
  const printavoReady = Boolean(printavoEmail && (printavoApiKey || hasSavedPrintavo));

  async function refreshSyncStatus() {
    const response = await fetch(`/api/runtime/organizations/${encodeURIComponent(orgSlug)}/printavo/sync`, { cache: "no-store" });
    const payload = (await response.json()) as { ok: boolean; error?: string; status?: PrintavoSyncStatus };
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error ?? "Printavo sync status failed");
    }
    setSyncStatus(payload.status ?? null);
    return payload.status ?? null;
  }

  useEffect(() => {
    if (!hasSavedPrintavo) {
      return;
    }
    void refreshSyncStatus().catch(() => undefined);
  }, [hasSavedPrintavo]);

  async function logout() {
    await fetch("/api/tenant-session", { method: "DELETE" });
    window.location.assign("/login");
  }

  async function updatePlugin(plugin: TenantPluginKey, enabled: boolean) {
    const previous = plugins;
    setPlugins((current) => ({
      ...current,
      [plugin]: { enabled },
    }));

    try {
      const response = await fetch(`/api/runtime/organizations/${encodeURIComponent(orgSlug)}/plugins`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plugin, enabled }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        plugins?: TenantPluginSettings;
      };
      if (!response.ok || !payload.ok || !payload.plugins) {
        throw new Error(payload.error ?? "Plugin update failed");
      }
      setPlugins(payload.plugins);
      setNotice(
        plugin === "routePlanning"
          ? `Route planning is now ${payload.plugins.routePlanning.enabled ? "on" : "off"} for this workspace. Reload the map to apply the change.`
          : "Plugin settings updated.",
      );
    } catch (caught) {
      setPlugins(previous);
      setNotice(caught instanceof Error ? caught.message : "Plugin update failed");
    }
  }

  async function previewPrintavo() {
    setBusy("printavo");
    setNotice(null);
    try {
      const response = await fetch(`/api/runtime/organizations/${encodeURIComponent(orgSlug)}/printavo/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: printavoEmail, apiKey: printavoApiKey }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        statuses?: Array<{ id: string; name: string; type: string }>;
        sampleOrderCount?: number;
        scores?: FraterniteesLeadScore[];
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Printavo preview failed");
      }
      setLiveStatuses(payload.statuses ?? []);
      setPreview({
        source: "printavo",
        label: "Live Printavo order sample",
        rawCount: payload.sampleOrderCount ?? 0,
        mappedCount: payload.sampleOrderCount ?? 0,
        scores: payload.scores ?? [],
      });
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "Printavo preview failed");
    } finally {
      setBusy(null);
    }
  }

  async function syncPrintavo() {
    setBusy("sync");
    setNotice(null);
    try {
      const response = await fetch(`/api/runtime/organizations/${encodeURIComponent(orgSlug)}/printavo/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: printavoEmail,
          apiKey: printavoApiKey || undefined,
          mode: "latest",
          pageLimit: 3,
          pageSize: 25,
        }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        imported?: {
          accountsSeen: number;
          createdAccounts: number;
          updatedAccounts: number;
          geocodedAccounts: number;
          geocodingProvider?: "google_maps" | "openstreetmap";
          geocodeAttempts?: number;
          geocodeLimitReachedAccounts?: number;
          upsertedOrders: number;
          skippedClosedPaidOrders: number;
        };
        sampleOrderCount?: number;
        scores?: FraterniteesLeadScore[];
        rateLimited?: boolean;
        retryAfterSeconds?: number | null;
        status?: PrintavoSyncStatus;
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Printavo sync failed");
      }
      setPreview({
        source: "printavo",
        label: "Synced Printavo CRM and orders",
        rawCount: payload.sampleOrderCount ?? 0,
        mappedCount: payload.imported?.upsertedOrders ?? 0,
        scores: payload.scores ?? [],
      });
      if (payload.rateLimited) {
        const waitSeconds = payload.retryAfterSeconds ?? DEFAULT_RATE_LIMIT_WAIT_SECONDS;
        setNotice(`Printavo rate limit reached after importing the latest available page. Wait about ${waitSeconds} seconds, then run sync again.`);
      } else {
        setNotice(
          `Latest Printavo sync complete: ${payload.imported?.accountsSeen ?? 0} accounts updated, ${payload.imported?.upsertedOrders ?? 0} orders upserted, ${payload.imported?.geocodedAccounts ?? 0} accounts geocoded via ${payload.imported?.geocodingProvider ?? "openstreetmap"}, ${payload.imported?.skippedClosedPaidOrders ?? 0} closed/paid cached orders skipped.`,
        );
      }
      if (payload.status) {
        setSyncStatus(payload.status);
      }
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "Printavo sync failed");
    } finally {
      setBusy(null);
    }
  }

  async function backfillPrintavoHistory() {
    setBusy("backfill");
    setNotice("Starting Printavo backfill. Keep this page open while it imports historical orders in batches.");
    let totalOrders = 0;
    let totalAccounts = 0;
    let totalSkipped = 0;
    let hasMore = true;
    let batchNumber = 0;

    try {
      while (hasMore && batchNumber < BACKFILL_MAX_BATCHES) {
        batchNumber += 1;
        const response = await fetch(`/api/runtime/organizations/${encodeURIComponent(orgSlug)}/printavo/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: printavoEmail,
            apiKey: printavoApiKey || undefined,
            mode: "backfill",
            pageLimit: BACKFILL_PAGE_LIMIT,
            pageSize: 25,
          }),
        });
        const payload = (await response.json()) as {
          ok: boolean;
          error?: string;
          imported?: {
            accountsSeen: number;
            geocodedAccounts: number;
            geocodingProvider?: "google_maps" | "openstreetmap";
            geocodeAttempts?: number;
            geocodeLimitReachedAccounts?: number;
            upsertedOrders: number;
            skippedClosedPaidOrders: number;
          };
          sampleOrderCount?: number;
          scores?: FraterniteesLeadScore[];
          rateLimited?: boolean;
          retryAfterSeconds?: number | null;
          backfill?: {
            hasMore?: boolean;
            completed?: boolean;
            fetchedOrders?: number;
            pagesFetched?: number;
            rateLimited?: boolean;
            retryAfterSeconds?: number | null;
          };
          status?: PrintavoSyncStatus;
        };

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error ?? "Printavo backfill failed");
        }

        totalOrders += payload.imported?.upsertedOrders ?? 0;
        totalAccounts += payload.imported?.accountsSeen ?? 0;
        totalSkipped += payload.imported?.skippedClosedPaidOrders ?? 0;
        hasMore = Boolean(payload.backfill?.hasMore);
        if (payload.status) {
          setSyncStatus(payload.status);
        }

        if (payload.scores?.length) {
          setPreview({
            source: "printavo",
            label: "Backfilled Printavo history",
            rawCount: payload.sampleOrderCount ?? 0,
            mappedCount: payload.imported?.upsertedOrders ?? 0,
            scores: payload.scores,
          });
        }

        setNotice(
          `Backfill batch ${batchNumber}: ${payload.backfill?.fetchedOrders ?? totalOrders} fetched so far, ${totalOrders} orders upserted this run, ${totalSkipped} closed/paid cached orders skipped.`,
        );

        if (payload.rateLimited || payload.backfill?.rateLimited) {
          const waitSeconds = payload.backfill?.retryAfterSeconds ?? payload.retryAfterSeconds ?? DEFAULT_RATE_LIMIT_WAIT_SECONDS;
          setNotice(
            `Printavo rate limit reached. Backfill is saved at ${payload.backfill?.fetchedOrders ?? totalOrders} fetched orders; resuming in ${waitSeconds} seconds.`,
          );
          await wait(waitSeconds * 1_000);
        } else if (hasMore) {
          await wait(BACKFILL_BATCH_DELAY_MS);
        }
      }

      setNotice(
        hasMore
          ? `Backfill paused after ${batchNumber} batches to keep the browser responsive. Run it again to continue.`
          : `Printavo historical backfill complete: ${totalOrders} orders upserted, ${totalAccounts} account batches scored, ${totalSkipped} closed/paid cached orders skipped. Account geocoding runs separately so order history can load faster.`,
      );
      await refreshSyncStatus();
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "Printavo backfill failed");
    } finally {
      setBusy(null);
    }
  }

  async function saveConnectors() {
    setBusy("save");
    setNotice(null);
    try {
      const response = await fetch(`/api/runtime/organizations/${encodeURIComponent(orgSlug)}/connectors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "printavo",
          fields: {
            email: printavoEmail,
            apiKey: printavoApiKey,
          },
        }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        integration?: IntegrationSummary;
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Connector save failed");
      }
      if (payload.integration) {
        setConnected((current) => {
          const next = current.filter((integration) => integration.provider !== payload.integration!.provider);
          next.push(payload.integration!);
          return next.sort((left, right) => left.displayName.localeCompare(right.displayName));
        });
      }
      setPrintavoApiKey("");
      setNotice("Connectors saved. Secrets are stored through the encrypted integration vault.");
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "Connector save failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main style={fraterniteesTheme} className="bg-[var(--background)] px-5 py-6 text-[var(--text-primary)] md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-5 border-b border-[var(--border-subtle)] pb-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-secondary-strong)]">
              {workspaceName} workspace
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">Close Rate Lead Scoring</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">
              Score chapters by close consistency, repeat monthly fit, order value, and hard-loss risk using Printavo as
              both the CRM and order-history source.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/accounts?org=${encodeURIComponent(orgSlug)}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3 text-sm font-semibold"
            >
              <ListChecks className="h-4 w-4" />
              Accounts
            </Link>
            <Link
              href={`/territory?org=${encodeURIComponent(orgSlug)}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3 text-sm font-semibold"
            >
              <MapPinned className="h-4 w-4" />
              Map
            </Link>
            <Link
              href={`/runtime/${encodeURIComponent(orgSlug)}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3 text-sm font-semibold"
            >
              <DatabaseZap className="h-4 w-4" />
              Runtime
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] px-4 py-3 text-sm font-semibold text-white"
              style={{ color: "#fff" }}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </header>

        {notice ? (
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 text-sm font-semibold text-[var(--text-secondary)]">
            <AlertTriangle className="h-4 w-4 text-[var(--accent-primary)]" />
            {notice}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[var(--accent-success)]" />
              <h2 className="text-lg font-semibold">Connected</h2>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["printavo"].map((provider) => (
                <span
                  key={provider}
                  className={classNames(
                    "rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em]",
                    connectedProviders.has(provider)
                      ? "bg-[rgba(32,147,101,0.12)] text-[var(--accent-success)]"
                      : "bg-[var(--surface-elevated)] text-[var(--text-tertiary)]",
                  )}
                >
                  {provider.replaceAll("_", " ")}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">Target customer</p>
            <p className="mt-2 text-2xl font-semibold">$1,500 monthly</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Prioritize repeatable chapter demand over one-off spikes.</p>
          </div>
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">Close-rate target</p>
            <p className="mt-2 text-2xl font-semibold">80%</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">High-ticket accounts get penalized when the next events ghost or cancel.</p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <PlugZap className="h-5 w-5 text-[var(--accent-primary)]" />
                <h2 className="text-xl font-semibold tracking-[-0.03em]">Integrations & plugin controls</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Tenant-specific controls live here so this workspace only carries the integrations and plugins it actually needs.
              </p>
            </div>
            <Link
              href={`/runtime/${encodeURIComponent(orgSlug)}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-semibold"
            >
              <DatabaseZap className="h-4 w-4" />
              Runtime
            </Link>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            <PluginToggle
              label="Printavo sync"
              description={`CRM, organization, and order-history import for ${workspaceName}.`}
              enabled={plugins.printavoSync.enabled}
              onToggle={() => updatePlugin("printavoSync", !plugins.printavoSync.enabled)}
            />
            <PluginToggle
              label="Runtime diagnostics"
              description="Sync jobs, cursors, integration health, and cached counts."
              enabled={plugins.runtimeDiagnostics.enabled}
              onToggle={() => updatePlugin("runtimeDiagnostics", !plugins.runtimeDiagnostics.enabled)}
            />
            <PluginToggle
              label="Route planning"
              description={`Field route workflow. Off for ${workspaceName} unless explicitly enabled.`}
              enabled={plugins.routePlanning.enabled}
              onToggle={() => updatePlugin("routePlanning", !plugins.routePlanning.enabled)}
            />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3">
              <DatabaseZap className="h-5 w-5 text-[var(--accent-primary)]" />
              <h2 className="text-xl font-semibold tracking-[-0.03em]">Printavo CRM and orders</h2>
            </div>
            {syncStatus ? (
              <div className="mt-5 grid gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Cached organizations</p>
                  <p className="mt-1 text-2xl font-semibold">{formatNumber(syncStatus.accounts)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Cached orders</p>
                  <p className="mt-1 text-2xl font-semibold">{formatNumber(syncStatus.orders)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">History cursor</p>
                  <p className="mt-1 text-2xl font-semibold">{formatNumber(syncStatus.backfill?.fetchedOrders ?? 0)}</p>
                </div>
              </div>
            ) : null}
            <div className="mt-5 space-y-3">
              <input
                type="email"
                value={printavoEmail}
                onChange={(event) => setPrintavoEmail(event.target.value)}
                placeholder="printavo@fraternitees.com"
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-3 text-sm font-semibold outline-none"
              />
              <input
                type="password"
                value={printavoApiKey}
                onChange={(event) => setPrintavoApiKey(event.target.value)}
                placeholder="Printavo API key"
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-3 text-sm font-semibold outline-none"
              />
              <button
                type="button"
                onClick={previewPrintavo}
                disabled={busy !== null || !printavoEmail || !printavoApiKey}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                style={{ color: "#fff" }}
              >
                {busy === "printavo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Test and score sample
              </button>
              <button
                type="button"
                onClick={syncPrintavo}
                disabled={busy !== null || !printavoReady}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-semibold disabled:opacity-60"
              >
                {busy === "sync" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPinned className="h-4 w-4" />}
                Sync latest to map and accounts
              </button>
              <button
                type="button"
                onClick={backfillPrintavoHistory}
                disabled={busy !== null || !printavoReady}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-card)] px-4 py-3 text-sm font-semibold disabled:opacity-60"
              >
                {busy === "backfill" ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseZap className="h-4 w-4" />}
                Sync all Printavo history
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[var(--accent-success)]" />
              <h2 className="text-xl font-semibold tracking-[-0.03em]">Printavo-only data model</h2>
            </div>
            <div className="mt-5 space-y-3 text-sm text-[var(--text-secondary)]">
              <p>Customers come from Printavo customer/contact records attached to quotes and invoices.</p>
              <p>Orders, statuses, totals, quantities, and dates come from the Printavo GraphQL orders query.</p>
              <p>The sync writes normalized FraterniTees accounts and order records into the shared map runtime.</p>
              <p>Closed and paid orders are cached after import so future syncs can skip rewriting settled historical records.</p>
              <p>Historical order sync and account geocoding run as separate batches so order history can load without waiting on map pin lookups.</p>
            </div>
          </div>
        </section>

        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 md:flex-row md:items-center">
          <div>
            <p className="font-semibold">Save connector settings</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">The Printavo API key is stored as an encrypted integration secret.</p>
          </div>
          <button
            type="button"
            onClick={saveConnectors}
            disabled={busy !== null}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            style={{ color: "#fff" }}
          >
            {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Save
          </button>
        </div>

        <ScoreTable preview={preview} />

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-xl font-semibold tracking-[-0.03em]">Status filters</h2>
            <div className="mt-4 space-y-4">
              {FRATERNITEES_STATUS_FILTERS.map((group) => (
                <div key={group.label} className="border-b border-[var(--border-subtle)] pb-4 last:border-b-0 last:pb-0">
                  <p className="font-semibold">{group.label}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{group.intent}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.statuses.map((status) => (
                      <span key={status} className="rounded-full bg-[var(--surface-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                        {status}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-xl font-semibold tracking-[-0.03em]">Live Printavo statuses</h2>
            {liveStatuses.length ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {liveStatuses.map((status) => (
                  <div key={status.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-sm">
                    <p className="font-semibold">{status.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{status.type}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--text-secondary)]">Run a Printavo preview to load the current account status list.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
