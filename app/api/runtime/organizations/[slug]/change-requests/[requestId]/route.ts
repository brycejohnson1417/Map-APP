import { NextResponse } from "next/server";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import {
  deleteChangeRequest,
  updateChangeRequest,
} from "@/lib/application/change-requests/change-request-service";
import { getWorkspaceExperienceBySlug } from "@/lib/application/workspace/workspace-service";
import type { ChangeRequestStatus } from "@/lib/domain/change-request";
import { resolveRouteParams } from "@/lib/presentation/route-params";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string; requestId: string }> | { slug: string; requestId: string } },
) {
  const { slug, requestId } = await resolveRouteParams(context.params);
  const sessionEmail = await getTenantSessionEmailForSlug(slug);
  if (!sessionEmail) {
    return NextResponse.json({ ok: false, error: "Tenant login is required to update change requests." }, { status: 401 });
  }

  const workspace = await getWorkspaceExperienceBySlug(slug);
  if (!workspace.organization) {
    return NextResponse.json({ ok: false, error: `Organization "${slug}" was not found.` }, { status: 404 });
  }

  const formData = await request.formData();
  const title = readText(formData, "title");
  const problem = readText(formData, "problem");
  const requestedOutcome = readText(formData, "requestedOutcome");

  if (!title || !problem || !requestedOutcome) {
    return NextResponse.json(
      { ok: false, error: "Title, what should change, and requested result are required." },
      { status: 400 },
    );
  }

  const attachments = formData
    .getAll("attachments")
    .filter((candidate): candidate is File => candidate instanceof File && candidate.size > 0);

  try {
    const updated = await updateChangeRequest({
      organizationId: workspace.organization.id,
      requestId,
      workspace: workspace.workspace,
      title,
      problem,
      requestedOutcome,
      businessContext: readText(formData, "businessContext") || null,
      acceptanceCriteria: readText(formData, "acceptanceCriteria") || null,
      attachments,
      status: (readText(formData, "status") || null) as ChangeRequestStatus | null,
    });

    return NextResponse.json({ ok: true, request: updated.request, warnings: updated.warnings });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to update request." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ slug: string; requestId: string }> | { slug: string; requestId: string } },
) {
  const { slug, requestId } = await resolveRouteParams(context.params);
  const sessionEmail = await getTenantSessionEmailForSlug(slug);
  if (!sessionEmail) {
    return NextResponse.json({ ok: false, error: "Tenant login is required to delete change requests." }, { status: 401 });
  }

  const workspace = await getWorkspaceExperienceBySlug(slug);
  if (!workspace.organization) {
    return NextResponse.json({ ok: false, error: `Organization "${slug}" was not found.` }, { status: 404 });
  }

  const deleted = await deleteChangeRequest({
    organizationId: workspace.organization.id,
    requestId,
  });

  if (!deleted) {
    return NextResponse.json({ ok: false, error: "Change request not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
