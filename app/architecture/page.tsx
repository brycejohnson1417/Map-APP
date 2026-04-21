import { AppFrame } from "@/components/layout/app-frame";
import { PrincipleList } from "@/components/marketing/principle-list";
import { syncPipelines } from "@/lib/content/home";

export default function ArchitecturePage() {
  return (
    <AppFrame>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent-secondary-strong)]">
            Architecture
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] md:text-6xl">
            Local-first runtime, explicit sync, one account system
          </h1>
          <p className="max-w-4xl text-lg leading-8 text-[var(--text-secondary)]">
            The platform is organized around Postgres read models, deterministic identity resolution, and event-driven
            CRM sync. The UI should never need to “go ask Notion again” just to be correct.
          </p>
        </header>

        <PrincipleList title="Core system shape" items={syncPipelines} />
      </div>
    </AppFrame>
  );
}
