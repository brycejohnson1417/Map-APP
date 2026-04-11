const cards = [
  {
    label: "Runtime source",
    value: "Supabase Postgres",
    note: "Local read models drive map, accounts, calendar, and vendor day surfaces.",
  },
  {
    label: "CRM ingestion",
    value: "Notion delta sync",
    note: "Webhooks mark records dirty. Background jobs update only changed pages.",
  },
  {
    label: "Order intelligence",
    value: "Nabis normalized locally",
    note: "Retailer matching, order rollups, sample flags, and customer state stay deterministic.",
  },
  {
    label: "Realtime scope",
    value: "Shared layers only",
    note: "Boundaries, rep-home markers, and light invalidation can be collaborative without repulling everything.",
  },
];

export function HeroGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[1.75rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">{card.label}</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{card.value}</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{card.note}</p>
        </div>
      ))}
    </div>
  );
}
