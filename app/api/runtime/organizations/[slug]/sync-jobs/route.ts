import { NextResponse } from "next/server";
import { OrganizationRepository } from "@/lib/infrastructure/supabase/organization-repository";
import { SyncJobRepository } from "@/lib/infrastructure/supabase/sync-job-repository";
import { resolveRouteParams } from "@/lib/presentation/route-params";

const organizations = new OrganizationRepository();
const syncJobs = new SyncJobRepository();

export async function GET(_: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
  const organization = await organizations.findBySlug(slug);

  if (!organization) {
    return NextResponse.json({ ok: false, error: "organization_not_found" }, { status: 404 });
  }

  const [jobs, statusCounts] = await Promise.all([
    syncJobs.listRecentByOrganizationId(organization.id, 20),
    syncJobs.countByStatusForOrganizationId(organization.id),
  ]);

  return NextResponse.json(
    {
      ok: true,
      organization,
      statusCounts,
      jobs,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=5, stale-while-revalidate=20",
      },
    },
  );
}
