import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import { registerIntegration } from "@/lib/application/runtime/bootstrap-service";
import { getWorkspaceExperienceBySlug } from "@/lib/application/workspace/workspace-service";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveRouteParams } from "@/lib/presentation/route-params";

const MAX_IMPORT_ROWS = 100;

const importRowSchema = z.object({
  sourceRowId: z.string().min(1).max(160),
  name: z.string().max(240).optional().default(""),
  addressLine1: z.string().max(240).optional().default(""),
  city: z.string().max(120).optional().default(""),
  state: z.string().max(80).optional().default(""),
  postalCode: z.string().max(40).optional().default(""),
  country: z.string().max(80).optional().default("US"),
  owner: z.string().max(160).optional().default(""),
  status: z.string().max(120).optional().default(""),
});

const requestSchema = z.object({
  rows: z.array(importRowSchema).min(1).max(MAX_IMPORT_ROWS),
});

function normalizedText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function hasLocation(row: z.infer<typeof importRowSchema>) {
  return Boolean(
    normalizedText(row.addressLine1) ||
      (normalizedText(row.city) && normalizedText(row.state)) ||
      normalizedText(row.postalCode),
  );
}

function normalizeSourceRowId(row: z.infer<typeof importRowSchema>) {
  return row.sourceRowId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
  const sessionEmail = await getTenantSessionEmailForSlug(slug);
  if (!sessionEmail) {
    return NextResponse.json({ ok: false, error: "Tenant login is required to import accounts." }, { status: 401 });
  }

  const workspace = await getWorkspaceExperienceBySlug(slug);
  if (!workspace.organization) {
    return NextResponse.json({ ok: false, error: `Organization "${slug}" was not found.` }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid import payload." }, { status: 400 });
  }

  const validRows = parsed.data.rows.filter((row) => row.name.trim() && hasLocation(row));
  if (!validRows.length) {
    return NextResponse.json(
      { ok: false, error: "At least one row needs a company name and a usable location." },
      { status: 400 },
    );
  }

  const integration = await registerIntegration({
    organizationId: workspace.organization.id,
    provider: "csv_import",
    displayName: "CSV Import",
    externalAccountId: "manual-upload",
    config: {
      savedByEmail: sessionEmail,
      selfServeConfiguredAt: new Date().toISOString(),
      fields: {
        source: "connection_hub_csv",
      },
    },
  });

  const supabase = getSupabaseAdminClient() as any;
  const sourceIds = validRows.map(normalizeSourceRowId).filter(Boolean);
  const { data: existingIdentities, error: identityLookupError } = await supabase
    .from("account_identity")
    .select("account_id, external_id")
    .eq("organization_id", workspace.organization.id)
    .eq("provider", "csv_import")
    .eq("external_entity_type", "account")
    .in("external_id", sourceIds);

  if (identityLookupError) {
    throw identityLookupError;
  }

  const accountIdBySourceId = new Map<string, string>();
  for (const identity of (existingIdentities ?? []) as Array<{ account_id: string; external_id: string }>) {
    accountIdBySourceId.set(identity.external_id, identity.account_id);
  }

  const now = new Date().toISOString();
  const rowsToUpdate: Array<Record<string, unknown>> = [];
  const rowsToInsert: Array<{ sourceId: string; row: z.infer<typeof importRowSchema>; payload: Record<string, unknown> }> = [];

  for (const row of validRows) {
    const sourceId = normalizeSourceRowId(row);
    const accountPayload = {
      organization_id: workspace.organization.id,
      name: row.name.trim(),
      display_name: row.name.trim(),
      account_status: normalizedText(row.status) || "imported",
      address_line_1: normalizedText(row.addressLine1) || null,
      city: normalizedText(row.city) || null,
      state: normalizedText(row.state) || null,
      postal_code: normalizedText(row.postalCode) || null,
      country: normalizedText(row.country) || "US",
      sales_rep_names: normalizedText(row.owner) ? [row.owner.trim()] : [],
      external_updated_at: now,
      custom_fields: {
        importedBy: sessionEmail,
        importedSource: "connection_hub_csv",
      },
      source_payload: {
        provider: "csv_import",
        sourceRowId: row.sourceRowId,
        importedAt: now,
      },
      updated_at: now,
    };

    const existingAccountId = accountIdBySourceId.get(sourceId);
    if (existingAccountId) {
      rowsToUpdate.push({ id: existingAccountId, ...accountPayload });
    } else {
      rowsToInsert.push({ sourceId, row, payload: accountPayload });
    }
  }

  if (rowsToUpdate.length) {
    const { error } = await supabase.from("account").upsert(rowsToUpdate, { onConflict: "id" });
    if (error) {
      throw error;
    }
  }

  const identityRows: Array<Record<string, unknown>> = [];
  if (rowsToInsert.length) {
    const { data: insertedAccounts, error: insertError } = await supabase
      .from("account")
      .insert(rowsToInsert.map((entry) => entry.payload))
      .select("id,source_payload");

    if (insertError) {
      throw insertError;
    }

    const inserted = (insertedAccounts ?? []) as Array<{ id: string; source_payload: Record<string, unknown> | null }>;
    inserted.forEach((account, index) => {
      const sourceId = rowsToInsert[index]?.sourceId;
      if (!sourceId) {
        return;
      }
      identityRows.push({
        organization_id: workspace.organization!.id,
        account_id: account.id,
        provider: "csv_import",
        external_entity_type: "account",
        external_id: sourceId,
        match_method: "connection_hub_csv_row",
        match_confidence: 1,
        metadata: {
          sourceRowId: rowsToInsert[index]?.row.sourceRowId,
          importedBy: sessionEmail,
        },
      });
    });
  }

  if (identityRows.length) {
    const { error } = await supabase.from("account_identity").upsert(identityRows, {
      onConflict: "organization_id,provider,external_entity_type,external_id",
    });
    if (error) {
      throw error;
    }
  }

  const { error: cursorError } = await supabase.from("sync_cursor").upsert(
    {
      organization_id: workspace.organization.id,
      installation_id: integration.id,
      provider: "csv_import",
      scope: "accounts",
      cursor_payload: {
        importedRows: validRows.length,
        createdAccounts: rowsToInsert.length,
        updatedAccounts: rowsToUpdate.length,
        importedAt: now,
      },
      status: "success",
      last_successful_sync_at: now,
      last_attempted_sync_at: now,
      last_error: null,
    },
    { onConflict: "organization_id,provider,scope" },
  );

  if (cursorError) {
    throw cursorError;
  }

  return NextResponse.json({
    ok: true,
    summary: {
      parsedRows: parsed.data.rows.length,
      importedRows: validRows.length,
      skippedRows: parsed.data.rows.length - validRows.length,
      createdAccounts: rowsToInsert.length,
      updatedAccounts: rowsToUpdate.length,
    },
  });
}
