"use client";

import { Download, FileText } from "lucide-react";

interface MockOrderProposalPanelProps {
  orgSlug: string;
  accountId: string;
}

export function MockOrderProposalPanel({ orgSlug, accountId }: MockOrderProposalPanelProps) {
  const pdfHref = `/api/runtime/organizations/${orgSlug}/accounts/${accountId}/mock-order-proposal/pdf`;

  return (
    <section className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--surface-elevated)] text-[var(--accent-primary)]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-secondary-strong)]">Live Inventory</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Mock order proposal</h2>
          </div>
        </div>
        <a
          href={pdfHref}
          style={{ color: "#fff" }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--text-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </a>
      </div>
    </section>
  );
}
