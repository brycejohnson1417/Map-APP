const lanes = [
  {
    title: "Sync ingestion",
    body: "Notion and Nabis write deltas into runtime tables through explicit cursors and job state.",
  },
  {
    title: "Read models",
    body: "Pins, account detail, filter facets, calendar events, and vendor day state are separate views.",
  },
  {
    title: "Collaboration",
    body: "Territory boundaries and rep-home markers sync to all users through shared runtime state.",
  },
];

export function TerritoryFoundationPreview() {
  return (
    <section className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
      <div className="mb-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-tertiary)]">Territory v2</p>
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">Shared runtime model, smaller payloads, cleaner sync</h2>
        <p className="max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
          The territory foundation starts by separating pin reads, overlays, and sync health from the current all-purpose
          CRM route. That is the prerequisite for faster loading and lower database transfer.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {lanes.map((lane) => (
          <div key={lane.title} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5">
            <h3 className="text-base font-semibold">{lane.title}</h3>
            <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{lane.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-[1.5rem] border border-[var(--border-strong)] bg-[linear-gradient(135deg,var(--accent-secondary-soft),transparent_60%)] p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-secondary-strong)]">Next implementation slices</p>
        <ul className="mt-3 space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
          <li>1. Land Supabase schema and v2 endpoints for pins, overlays, and sync health.</li>
          <li>2. Backfill runtime accounts from the current production database and Notion snapshots.</li>
          <li>3. Cut the map onto the small pin payload before touching account detail parity.</li>
        </ul>
      </div>
    </section>
  );
}
