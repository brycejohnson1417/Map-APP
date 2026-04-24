import type { ReactNode } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface FilterToolbarSelect {
  name: string;
  label: string;
  value: string;
  options: SelectOption[];
}

export function FilterToolbar({
  action,
  hiddenInputs,
  queryName = "q",
  queryValue,
  queryPlaceholder,
  selects,
  submitLabel = "Apply",
  trailing,
}: {
  action: string;
  hiddenInputs?: Array<{ name: string; value: string }>;
  queryName?: string;
  queryValue: string;
  queryPlaceholder: string;
  selects: FilterToolbarSelect[];
  submitLabel?: string;
  trailing?: ReactNode;
}) {
  return (
    <form action={action} className="grid gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
      {hiddenInputs?.map((input) => <input key={`${input.name}:${input.value}`} type="hidden" name={input.name} value={input.value} />)}
      <label className="flex min-w-0 items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-3">
        <Search className="h-5 w-5 text-[var(--text-tertiary)]" />
        <input
          name={queryName}
          defaultValue={queryValue}
          placeholder={queryPlaceholder}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
        />
      </label>
      {selects.map((select) => (
        <label key={select.name} className="grid gap-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)] sm:grid-cols-[auto_1fr] sm:items-center">
          {select.label}
          <select
            name={select.name}
            defaultValue={select.value}
            className="min-w-48 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-3 text-sm font-semibold normal-case tracking-normal text-[var(--text-primary)] outline-none"
          >
            {select.options.map((option) => (
              <option key={`${select.name}:${option.value}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      <div className="flex items-center gap-3">
        {trailing}
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--text-primary)] px-5 py-3 text-sm font-semibold text-white"
          style={{ color: "#fff" }}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
