import { AppFrame } from "@/components/layout/app-frame";
import { RepTodayWorkspace } from "@/components/today/rep-today-workspace";
import { getRepTodaySummary } from "@/lib/application/runtime/rep-today-service";
import { orgSlugFromSearchParams } from "@/lib/presentation/org-slug";

export const dynamic = "force-dynamic";

interface TodayPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TodayPage({ searchParams }: TodayPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const orgSlug = orgSlugFromSearchParams(resolvedSearchParams);
  const summary = await getRepTodaySummary(orgSlug);

  return (
    <AppFrame organizationName={summary.organizationName} organizationSlug={orgSlug}>
      <RepTodayWorkspace summary={summary} />
    </AppFrame>
  );
}
