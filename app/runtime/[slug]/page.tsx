import { notFound } from "next/navigation";
import { AppFrame } from "@/components/layout/app-frame";
import { getOrganizationRuntimeSnapshot } from "@/lib/application/runtime/organization-service";

interface RuntimePageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

async function resolveParams(params: RuntimePageProps["params"]) {
  return Promise.resolve(params);
}

export default async function RuntimePage({ params }: RuntimePageProps) {
  const { slug } = await resolveParams(params);
  const snapshot = await getOrganizationRuntimeSnapshot(slug);

  if (!snapshot) {
    notFound();
  }

  return (
    <AppFrame>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
        <header className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-secondary-strong)]">
            Runtime
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
            {snapshot.organization.name}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Organization slug: <span className="font-semibold">{snapshot.organization.slug}</span>
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
            <h2 className="text-lg font-semibold">Integrations</h2>
            <div className="mt-4 space-y-3 text-sm">
              {snapshot.integrations.length === 0 ? (
                <p className="text-[var(--text-tertiary)]">No integrations yet.</p>
              ) : (
                snapshot.integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{integration.displayName}</p>
                      <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                        {integration.provider}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                      Status: <span className="font-semibold">{integration.status}</span>
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
            <h2 className="text-lg font-semibold">Recent sync jobs</h2>
            <div className="mt-4 space-y-3 text-sm">
              {snapshot.recentSyncJobs.length === 0 ? (
                <p className="text-[var(--text-tertiary)]">No sync jobs recorded yet.</p>
              ) : (
                snapshot.recentSyncJobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{job.kind}</p>
                      <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                        {job.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                      Attempts: <span className="font-semibold">{job.attempts}</span>
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </AppFrame>
  );
}
