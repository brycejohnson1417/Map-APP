import type { LucideIcon } from "lucide-react";

export function SectionCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-elevated)] text-[var(--accent-primary)]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{description}</p>
    </div>
  );
}
