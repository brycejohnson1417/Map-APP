"use client";

import { useMemo, useState } from "react";
import { Calculator, ChevronDown, ChevronUp, Copy, Download, Loader2, Mail } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import type { PppSavingsReport } from "@/lib/application/runtime/ppp-savings-service";

interface PppSavingsPanelProps {
  orgSlug: string;
  accountId: string;
}

interface SavingsResponse {
  ok: boolean;
  report?: PppSavingsReport;
  error?: string;
}

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

export function PppSavingsPanel({ orgSlug, accountId }: PppSavingsPanelProps) {
  const [report, setReport] = useState<PppSavingsReport | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const mailtoHref = useMemo(() => {
    if (!report?.recipientEmail || !draft) {
      return null;
    }
    return `mailto:${encodeURIComponent(report.recipientEmail)}?subject=${encodeURIComponent(report.email.subject)}&body=${encodeURIComponent(draft)}`;
  }, [draft, report]);

  const pdfHref = report ? `/api/runtime/organizations/${orgSlug}/accounts/${accountId}/ppp-savings/pdf?year=${report.year}` : null;

  async function calculateSavings() {
    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch(`/api/runtime/organizations/${orgSlug}/accounts/${accountId}/ppp-savings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ year: new Date().getFullYear() }),
      });
      const payload = (await response.json()) as SavingsResponse;
      if (!response.ok || !payload.ok || !payload.report) {
        throw new Error(payload.error ?? "Unable to calculate PPP savings.");
      }
      setReport(payload.report);
      setDraft(payload.report.email.body);
      setCollapsed(false);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to calculate PPP savings.");
    } finally {
      setLoading(false);
    }
  }

  async function copyDraft() {
    if (!report || !draft) {
      return;
    }
    if (typeof ClipboardItem !== "undefined" && report.email.html) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([DOMPurify.sanitize(report.email.html)], { type: "text/html" }),
          "text/plain": new Blob([draft], { type: "text/plain" }),
        }),
      ]);
    } else {
      await navigator.clipboard.writeText(draft);
    }
    setCopied(true);
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-[var(--shadow-soft)]">
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--border-subtle)] p-6 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-secondary-strong)]">Preferred Partner</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">PPP savings email</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {report ? (
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              {collapsed ? "Expand" : "Collapse"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={calculateSavings}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--text-primary)] px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
            {report ? "Recalculate" : "Calculate PPP savings"}
          </button>
        </div>
      </div>

      {error ? <div className="border-b border-[var(--border-subtle)] p-5 text-sm font-semibold text-[var(--accent-danger)]">{error}</div> : null}

      {report && collapsed ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
          <div className="flex flex-wrap gap-4 text-[var(--text-secondary)]">
            <span>
              <strong className="text-[var(--text-primary)]">{formatMoney(report.totalSavings)}</strong> savings
            </span>
            <span>
              <strong className="text-[var(--text-primary)]">{report.orders.length}</strong> orders
            </span>
            <span>
              <strong className="text-[var(--text-primary)]">{formatMoney(report.preferredTotal)}</strong> PPP total
            </span>
          </div>
          {pdfHref ? (
            <a
              href={pdfHref}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </a>
          ) : null}
        </div>
      ) : report ? (
        <div className="grid gap-0 xl:grid-cols-[0.75fr_1.25fr]">
          <div className="border-b border-[var(--border-subtle)] p-6 xl:border-b-0 xl:border-r">
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">YTD savings</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{formatMoney(report.totalSavings)}</p>
              </div>
              <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Orders</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{report.orders.length}</p>
              </div>
              <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Est. PPP total</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{formatMoney(report.preferredTotal)}</p>
              </div>
            </div>

            <div className="mt-5 divide-y divide-[var(--border-subtle)] text-sm">
              {report.orders.map((order) => (
                <div key={order.externalOrderId} className="py-3">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold">#{order.orderNumber}</p>
                    <p className="font-semibold text-[var(--accent-success)]">{formatMoney(order.savings)}</p>
                  </div>
                  <p className="mt-1 text-[var(--text-tertiary)]">
                    {formatMoney(order.paidTotal)} paid / {formatMoney(order.preferredTotal)} PPP
                  </p>
                </div>
              ))}
              {!report.orders.length ? <div className="py-3 text-[var(--text-secondary)]">No eligible paid orders found for {report.year}.</div> : null}
            </div>

            {report.diagnostics.skippedLineItems || report.diagnostics.unmatchedLineItems || report.diagnostics.warnings.length ? (
              <div className="mt-5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 text-xs leading-6 text-[var(--text-secondary)]">
                {report.diagnostics.skippedLineItems ? <p>{report.diagnostics.skippedLineItems} $0/sample line items were excluded from PPP savings.</p> : null}
                {report.diagnostics.unmatchedLineItems ? <p>{report.diagnostics.unmatchedLineItems} line items did not match the PPP pricing table.</p> : null}
                {report.diagnostics.warnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] p-4">
              <p className="min-w-0 text-sm font-semibold text-[var(--text-secondary)]">
                {report.recipientEmail ? report.recipientEmail : "No contact email on this account"}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyDraft}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied" : "Copy email"}
                </button>
                {pdfHref ? (
                  <a
                    href={pdfHref}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </a>
                ) : null}
                {mailtoHref ? (
                  <a
                    href={mailtoHref}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent-primary)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-primary-strong)]"
                  >
                    <Mail className="h-4 w-4" />
                    Open email
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-[var(--accent-primary)] px-3 py-2 text-sm font-semibold text-white opacity-50"
                  >
                    <Mail className="h-4 w-4" />
                    Open email
                  </button>
                )}
              </div>
            </div>
            <div className="min-h-[24rem] w-full overflow-auto bg-white p-6 text-sm text-black">
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(report.email.html) }} />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 text-sm text-[var(--text-secondary)]">PPP savings will appear here after calculation.</div>
      )}
    </section>
  );
}
