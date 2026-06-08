import { NextResponse } from "next/server";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import { normalizeManualLeadGrade } from "@/lib/application/fraternitees/account-insights";
import { getWorkspaceExperienceBySlug } from "@/lib/application/workspace/workspace-service";
import { AuditEventRepository } from "@/lib/infrastructure/supabase/audit-event-repository";
import { OrganizationMemberRepository } from "@/lib/infrastructure/supabase/organization-member-repository";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveRouteParams } from "@/lib/presentation/route-params";

const writableRoles = new Set(["owner", "admin", "manager"]);

async function resolveActor(organizationId: string, email: string) {
  const members = await new OrganizationMemberRepository().listByEmail(email);
  return members.find((member) => member.organizationId === organizationId) ?? null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string; accountId: string }> | { slug: string; accountId: string } },
) {
  const { slug, accountId } = await resolveRouteParams(context.params);
  const sessionEmail = await getTenantSessionEmailForSlug(slug);
  if (!sessionEmail) {
    return NextResponse.json({ ok: false, error: "Tenant login is required to update account grades." }, { status: 401 });
  }

  const workspace = await getWorkspaceExperienceBySlug(slug);
  if (!workspace.organization) {
    return NextResponse.json({ ok: false, error: `Organization "${slug}" was not found.` }, { status: 404 });
  }

  const actor = await resolveActor(workspace.organization.id, sessionEmail);
  if (!actor || !writableRoles.has(actor.role)) {
    return NextResponse.json({ ok: false, error: "Manager access is required to update account grades." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const manualLeadGrade = normalizeManualLeadGrade((body as Record<string, unknown> | null)?.manualLeadGrade);
  const reason = typeof (body as Record<string, unknown> | null)?.reason === "string"
    ? String((body as Record<string, unknown>).reason).trim().slice(0, 500)
    : "";

  const supabase = getSupabaseAdminClient() as any;
  const { data: account, error: accountError } = await supabase
    .from("account")
    .select("id,organization_id,custom_fields")
    .eq("id", accountId)
    .eq("organization_id", workspace.organization.id)
    .maybeSingle();

  if (accountError) {
    throw accountError;
  }
  if (!account) {
    return NextResponse.json({ ok: false, error: "Account was not found for this tenant." }, { status: 404 });
  }

  const previousCustomFields =
    typeof account.custom_fields === "object" && account.custom_fields !== null ? account.custom_fields : {};
  const nextCustomFields = { ...previousCustomFields };

  if (manualLeadGrade) {
    nextCustomFields.manualLeadGrade = manualLeadGrade;
    nextCustomFields.manualLeadGradeReason = reason || null;
    nextCustomFields.manualLeadGradeUpdatedAt = new Date().toISOString();
    nextCustomFields.manualLeadGradeUpdatedBy = sessionEmail;
  } else {
    delete nextCustomFields.manualLeadGrade;
    delete nextCustomFields.manualLeadGradeReason;
    delete nextCustomFields.manualLeadGradeUpdatedAt;
    delete nextCustomFields.manualLeadGradeUpdatedBy;
  }

  const { data: updated, error: updateError } = await supabase
    .from("account")
    .update({
      custom_fields: nextCustomFields,
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId)
    .eq("organization_id", workspace.organization.id)
    .select("id,custom_fields")
    .single();

  if (updateError) {
    throw updateError;
  }

  await new AuditEventRepository().record({
    organizationId: workspace.organization.id,
    actorMemberId: actor.id,
    eventType: "account_updated",
    entityType: "account",
    entityId: accountId,
    payload: {
      fields: ["custom_fields.manualLeadGrade"],
      manualLeadGrade,
      cleared: !manualLeadGrade,
    },
  });

  return NextResponse.json({
    ok: true,
    account: {
      id: updated.id,
      manualLeadGrade: updated.custom_fields?.manualLeadGrade ?? null,
      manualLeadGradeReason: updated.custom_fields?.manualLeadGradeReason ?? null,
      manualLeadGradeUpdatedAt: updated.custom_fields?.manualLeadGradeUpdatedAt ?? null,
      manualLeadGradeUpdatedBy: updated.custom_fields?.manualLeadGradeUpdatedBy ?? null,
    },
  });
}
