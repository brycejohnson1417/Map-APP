import { NextResponse } from "next/server";
import { OrganizationRepository } from "@/lib/infrastructure/supabase/organization-repository";
import { SyncCursorRepository } from "@/lib/infrastructure/supabase/sync-cursor-repository";
import { SyncJobRepository } from "@/lib/infrastructure/supabase/sync-job-repository";
import { resolveRouteParams } from "@/lib/presentation/route-params";

const organizations = new OrganizationRepository();
const syncCursors = new SyncCursorRepository();
const syncJobs = new SyncJobRepository();

export async function GET(_: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
  const organization = await organizations.findBySlug(slug);

  if (!organization) {
    return NextResponse.json({ ok: false, error: "organization_not_found" }, { status: 404 });
  }

  const [jobs, cursors, statusCounts] = await Promise.all([
    syncJobs.listRecentByOrganizationId(organization.id, 20),
    syncCursors.listByOrganizationId(organization.id),
    syncJobs.countByStatusForOrganizationId(organization.id),
  ]);
  const currentSyncErrors = cursors.filter((cursor) => cursor.status === "error").length;

  return NextResponse.json(
    {
      ok: true,
      organization,
      statusCounts,
      currentSyncErrors,
      cursors,
      jobs,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=5, stale-while-revalidate=20",
      },
    },
  );
}
