export function PrincipleList({
  title,
  items,
}: {
  title: string;
  items: Array<{ title: string; body: string }>;
}) {
  return (
    <section className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
      <h2 className="text-xl font-semibold tracking-[-0.02em]">{title}</h2>
      <div className="mt-5 grid gap-4">
        {items.map((item) => (
          <div key={item.title} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5">
            <h3 className="text-base font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
