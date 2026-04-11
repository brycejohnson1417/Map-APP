import { AppFrame } from "@/components/layout/app-frame";
import { RuntimeStatusPanel } from "@/components/runtime/runtime-status-panel";
import { TerritoryFoundationPreview } from "@/components/territory/territory-foundation-preview";

export default function TerritoryPage() {
  return (
    <AppFrame>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent-secondary-strong)]">
            Territory
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] md:text-6xl">Runtime foundation preview</h1>
          <p className="max-w-4xl text-base leading-8 text-[var(--text-secondary)]">
            This surface is intentionally reading from the new Supabase runtime layer. It is the starting point for the
            eventual cutover away from the old sync-on-read territory stack.
          </p>
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <TerritoryFoundationPreview />
          <RuntimeStatusPanel />
        </div>
      </div>
    </AppFrame>
  );
}
