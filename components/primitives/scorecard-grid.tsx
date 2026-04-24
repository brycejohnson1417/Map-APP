import Link from "next/link";

export interface ScorecardGridItem {
  id: string;
  label: string;
  value: string;
  accentClassName?: string;
  href?: string;
}

export function ScorecardGrid({ items }: { items: ScorecardGridItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => {
        const content = (
          <>
            <p className={`text-xs font-bold uppercase tracking-[0.18em] ${item.accentClassName ?? "text-[var(--text-tertiary)]"}`}>
              {item.label}
            </p>
            <p className="mt-4 text-5xl font-bold tracking-normal text-[var(--text-primary)]">{item.value}</p>
          </>
        );

        return item.href ? (
          <Link
            key={item.id}
            href={item.href}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)] transition hover:bg-[var(--surface-elevated)]"
          >
            {content}
          </Link>
        ) : (
          <div
            key={item.id}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
