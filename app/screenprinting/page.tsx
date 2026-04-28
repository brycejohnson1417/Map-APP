import { notFound, redirect } from "next/navigation";
import { AppFrame } from "@/components/layout/app-frame";
import {
  ScreenprintingWorkspace,
  type ModuleView,
  type SocialView,
} from "@/components/screenprinting/screenprinting-workspace";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import {
  ScreenprintingServiceError,
  getScreenprintingWorkspaceSummary,
} from "@/lib/application/screenprinting/screenprinting-service";
import { orgSlugFromSearchParams } from "@/lib/presentation/org-slug";

export const dynamic = "force-dynamic";

interface ScreenprintingPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const socialViews = new Set<SocialView>(["dashboard", "accounts", "account-detail", "posts", "alerts", "calendar", "conversations", "campaigns", "import"]);

export default async function ScreenprintingPage({ searchParams }: ScreenprintingPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const orgSlug = orgSlugFromSearchParams(resolvedSearchParams);
  const moduleParam = typeof resolvedSearchParams.module === "string" ? resolvedSearchParams.module : null;
  const socialParam = typeof resolvedSearchParams.social === "string" ? resolvedSearchParams.social : null;
  const initialModuleView: ModuleView = moduleParam === "social" ? "social" : moduleParam === "admin" ? "admin" : "sales";
  const initialSocialView: SocialView = socialParam && socialViews.has(socialParam as SocialView) ? (socialParam as SocialView) : "dashboard";
  const sessionEmail = await getTenantSessionEmailForSlug(orgSlug);

  if (!sessionEmail) {
    redirect(`/login?org=${encodeURIComponent(orgSlug)}`);
  }

  try {
    const summary = await getScreenprintingWorkspaceSummary(orgSlug);
    return (
      <AppFrame organizationName={summary.organization?.name ?? summary.workspace.displayName} organizationSlug={orgSlug}>
        <ScreenprintingWorkspace
          summary={summary}
          orgSlug={orgSlug}
          initialModuleView={initialModuleView}
          initialSocialView={initialSocialView}
        />
      </AppFrame>
    );
  } catch (error) {
    if (error instanceof ScreenprintingServiceError && error.status === 400) {
      notFound();
    }
    throw error;
  }
}
