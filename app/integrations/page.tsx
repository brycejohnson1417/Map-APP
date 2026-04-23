import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BarChart3, PlugZap } from "lucide-react";
import { TENANT_SESSION_EMAIL_COOKIE, TENANT_SESSION_SLUG_COOKIE } from "@/lib/application/auth/tenant-access";
import {
  FRATERNITEES_SESSION_COOKIE,
  ensureFraterniteesWorkspace,
  isFraterniteesEmail,
} from "@/lib/application/fraternitees/onboarding-service";
import { FraterniteesWorkspace } from "@/components/fraternitees/fraternitees-portal";
import { AppFrame } from "@/components/layout/app-frame";
import { orgSlugFromSearchParams } from "@/lib/presentation/org-slug";

export const dynamic = "force-dynamic";

interface IntegrationsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function IntegrationsPage({ searchParams }: IntegrationsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const orgSlug = orgSlugFromSearchParams(resolvedSearchParams);
  const cookieStore = await cookies();

  if (orgSlug === "fraternitees") {
    const directSessionEmail = cookieStore.get(FRATERNITEES_SESSION_COOKIE)?.value ?? "";
    const tenantSessionEmail = cookieStore.get(TENANT_SESSION_EMAIL_COOKIE)?.value ?? "";
    const tenantSessionSlug = cookieStore.get(TENANT_SESSION_SLUG_COOKIE)?.value ?? "";
    const sessionEmail = directSessionEmail || (tenantSessionSlug === "fraternitees" ? tenantSessionEmail : "");

    if (!isFraterniteesEmail(sessionEmail)) {
      redirect("/login");
    }

    const snapshot = await ensureFraterniteesWorkspace(sessionEmail);
    return (
      <AppFrame organizationName="FraterniTees" organizationSlug="fraternitees">
        <FraterniteesWorkspace
          sessionEmail={sessionEmail}
          integrations={snapshot.integrations}
          pluginSettings={snapshot.pluginSettings}
        />
      </AppFrame>
    );
  }

  return (
    <AppFrame organizationName="PICC New York" organizationSlug="picc">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 md:px-10">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent-secondary-strong)]">
            Integrations & Plugins
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">Workspace controls</h1>
        </header>
        <section className="grid gap-4 md:grid-cols-2">
          <Link href="/runtime/picc" className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
            <BarChart3 className="h-5 w-5 text-[var(--accent-secondary-strong)]" />
            <h2 className="mt-4 text-xl font-semibold">Runtime</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Review sync cursors, jobs, integrations, and runtime health.</p>
          </Link>
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
            <PlugZap className="h-5 w-5 text-[var(--accent-primary)]" />
            <h2 className="mt-4 text-xl font-semibold">Plugins</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Tenant plugin controls will live here as additional integrations are enabled.</p>
          </div>
        </section>
      </div>
    </AppFrame>
  );
}
