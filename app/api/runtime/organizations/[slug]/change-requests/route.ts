import { NextResponse } from "next/server";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import {
  createChangeRequest,
  listChangeRequestsForOrganization,
} from "@/lib/application/change-requests/change-request-service";
import { getWorkspaceExperienceBySlug } from "@/lib/application/workspace/workspace-service";
import type { ChangeRequestCaptureContext, ChangeRequestClassification } from "@/lib/domain/change-request";
import { resolveRouteParams } from "@/lib/presentation/route-params";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readCaptureContext(formData: FormData): ChangeRequestCaptureContext | null {
  const raw = readText(formData, "captureContext");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ChangeRequestCaptureContext;
  } catch {
    return null;
  }
}

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
  const sessionEmail = await getTenantSessionEmailForSlug(slug);
  if (!sessionEmail) {
    return NextResponse.json({ ok: false, error: "Tenant login is required to view change requests." }, { status: 401 });
  }

  const workspace = await getWorkspaceExperienceBySlug(slug);
  if (!workspace.organization) {
    return NextResponse.json({ ok: false, error: `Organization "${slug}" was not found.` }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    requests: await listChangeRequestsForOrganization(workspace.organization.id),
  });
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
  const sessionEmail = await getTenantSessionEmailForSlug(slug);
  if (!sessionEmail) {
    return NextResponse.json({ ok: false, error: "Tenant login is required to create change requests." }, { status: 401 });
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
      { ok: false, error: "Title, problem, and requested outcome are required." },
      { status: 400 },
    );
  }

  const attachments = formData
    .getAll("attachments")
    .filter((candidate): candidate is File => candidate instanceof File && candidate.size > 0);

  try {
    const created = await createChangeRequest({
      organizationId: workspace.organization.id,
      requestedByEmail: sessionEmail,
      workspace: workspace.workspace,
      title,
      currentUrl: readText(formData, "currentUrl") || null,
      surface: readText(formData, "surface") || null,
      classification: (readText(formData, "classification") || null) as ChangeRequestClassification | null,
      problem,
      requestedOutcome,
      businessContext: readText(formData, "businessContext") || null,
      acceptanceCriteria: readText(formData, "acceptanceCriteria") || null,
      attachments,
      captureContext: readCaptureContext(formData),
    });

    return NextResponse.json({
      ok: true,
      request: created.request,
      warnings: created.warnings,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to create change request." },
      { status: 400 },
    );
  }
}
