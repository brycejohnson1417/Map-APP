import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Eye,
  Flag,
  Inbox,
  Mail,
  MessageSquare,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import type { getScreenprintingWorkspaceSummary } from "@/lib/application/screenprinting/screenprinting-service";

type ScreenprintingWorkspaceSummary = Awaited<ReturnType<typeof getScreenprintingWorkspaceSummary>>;

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US");

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function labelFromKey(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof BarChart3 }) {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{label}</p>
        <Icon className="h-4 w-4 text-[var(--accent-secondary-strong)]" />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof BarChart3;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] p-5">
        <Icon className="h-5 w-5 text-[var(--accent-secondary-strong)]" />
        <h2 className="text-xl font-semibold tracking-[-0.03em]">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function ScreenprintingWorkspace({ summary, orgSlug }: { summary: ScreenprintingWorkspaceSummary; orgSlug: string }) {
  const sales = summary.salesDashboard.metrics;
  const social = summary.socialDashboard.metrics;
  const orders = summary.orders.orders;
  const firstPipeline = summary.opportunities.pipelines[0];
  const activeFlags = Object.entries(summary.featureFlags).filter(([, enabled]) => enabled);
  const disabledFlags = Object.entries(summary.featureFlags).filter(([, enabled]) => !enabled);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-secondary-strong)]">
            Screenprinting
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
            {summary.organization?.name ?? summary.workspace.displayName}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">
            Tenant-scoped sales, social, configuration, and identity workflows for {orgSlug}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          <span className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-[var(--accent-success)]" />
            Printavo read-only
          </span>
          <span className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2">
            <Mail className="h-4 w-4 text-[var(--accent-secondary-strong)]" />
            Draft-only email
          </span>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Revenue" value={formatMoney(sales.revenue)} icon={BarChart3} />
        <MetricCard label="Orders" value={formatNumber(summary.orders.pagination.total)} icon={ShoppingBag} />
        <MetricCard label="Tracked social" value={formatNumber(social.trackedAccounts)} icon={Eye} />
        <MetricCard label="Identity queue" value={formatNumber(summary.identity.suggestions.length)} icon={Users} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Section title="Admin Configuration" icon={Settings2}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-[var(--surface-elevated)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Feature flags</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeFlags.map(([flag]) => (
                  <span key={flag} className="inline-flex items-center gap-2 rounded-lg bg-[rgba(32,147,101,0.12)] px-3 py-2 text-xs font-semibold text-[var(--accent-success)]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {labelFromKey(flag)}
                  </span>
                ))}
                {disabledFlags.map(([flag]) => (
                  <span key={flag} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-xs font-semibold text-[var(--text-tertiary)]">
                    <Flag className="h-3.5 w-3.5" />
                    {labelFromKey(flag)}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-[var(--surface-elevated)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Dirty data warnings</p>
              <div className="mt-3 space-y-2">
                {summary.salesDashboard.dirtyDataWarnings.map((warning) => (
                  <div key={warning.fieldKey} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--accent-primary)]" />
                    <span>{warning.warning}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                <tr>
                  <th className="py-2 pr-4">Source status</th>
                  <th className="py-2 pr-4">Bucket</th>
                  <th className="py-2 pr-4">Trust</th>
                  <th className="py-2 pr-4">Enabled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {summary.config.statusMappings.map((mapping) => (
                  <tr key={mapping.sourceValue}>
                    <td className="py-3 pr-4 font-semibold">{mapping.sourceValue}</td>
                    <td className="py-3 pr-4">{labelFromKey(mapping.targetBucket)}</td>
                    <td className="py-3 pr-4">{labelFromKey(mapping.trustLevel)}</td>
                    <td className="py-3 pr-4">{mapping.enabled ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Sales MVP" icon={BarChart3}>
          <div className="grid gap-3 md:grid-cols-3">
            <MetricCard label="Avg order" value={formatMoney(sales.averageOrderValue)} icon={ShoppingBag} />
            <MetricCard label="Due reorders" value={formatNumber(sales.dueReorders)} icon={Inbox} />
            <MetricCard label="Pipeline cards" value={formatNumber(firstPipeline?.stages.reduce((sum, stage) => sum + stage.count, 0) ?? 0)} icon={BarChart3} />
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                <tr>
                  <th className="py-2 pr-4">Order</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Payment</th>
                  <th className="py-2 pr-4">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {orders.slice(0, 8).map((order) => (
                  <tr key={order.id}>
                    <td className="py-3 pr-4 font-semibold">{order.orderNumber ?? order.externalOrderId}</td>
                    <td className="py-3 pr-4">{order.customerName}</td>
                    <td className="py-3 pr-4">{labelFromKey(order.statusBucket)}</td>
                    <td className="py-3 pr-4">{labelFromKey(order.paymentBucket)}</td>
                    <td className="py-3 pr-4">{formatMoney(order.orderTotal ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Social MVP" icon={MessageSquare}>
          <div className="grid gap-3 md:grid-cols-3">
            <MetricCard label="Active accounts" value={formatNumber(social.activeAccounts)} icon={Users} />
            <MetricCard label="Posts" value={formatNumber(social.totalPosts)} icon={MessageSquare} />
            <MetricCard label="Unread alerts" value={formatNumber(social.unreadAlerts)} icon={AlertTriangle} />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {summary.socialAccounts.accounts.slice(0, 6).map((account) => (
              <div key={account.id} className="rounded-lg bg-[var(--surface-elevated)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">@{account.handle}</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{account.platform} / {account.ownership}</p>
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-tertiary)]">{formatNumber(account.followerCount ?? 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Identity Resolution" icon={Users}>
          <div className="space-y-3">
            {summary.identity.suggestions.map((suggestion) => (
              <div key={suggestion.id} className="rounded-lg bg-[var(--surface-elevated)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{labelFromKey(suggestion.sourceType)} to {labelFromKey(suggestion.targetType)}</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{suggestion.reason}</p>
                  </div>
                  <span className="rounded-lg bg-[var(--surface-card)] px-3 py-1 text-xs font-semibold">
                    {Math.round(suggestion.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
            {!summary.identity.suggestions.length ? (
              <p className="text-sm text-[var(--text-secondary)]">No pending identity suggestions.</p>
            ) : null}
          </div>
        </Section>
      </div>
    </div>
  );
}
