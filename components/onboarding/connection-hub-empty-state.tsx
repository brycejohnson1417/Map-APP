import Link from "next/link";
import { ArrowRight, DatabaseZap } from "lucide-react";
import { orgScopedHref } from "@/lib/presentation/org-slug";

export function ConnectionHubEmptyState({
  orgSlug,
  title,
  body,
}: {
  orgSlug: string;
  title: string;
  body: string;
}) {
  return (
    <section className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-elevated)] text-[var(--accent-secondary-strong)]">
            <DatabaseZap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">No account data</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">{body}</p>
          </div>
        </div>
        <Link
          href={orgScopedHref("/integrations", orgSlug)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] px-5 py-3 text-sm font-semibold text-white"
          style={{ color: "#fff" }}
        >
          Import first account data
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
