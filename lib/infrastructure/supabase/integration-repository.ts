import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ExternalProvider, IntegrationInstallation } from "@/lib/domain/runtime";
import { encryptJson } from "@/lib/infrastructure/security/encryption";
import { mapIntegrationRow } from "@/lib/infrastructure/supabase/runtime-mappers";

interface UpsertIntegrationInput {
  organizationId: string;
  provider: ExternalProvider;
  displayName: string;
  externalAccountId?: string | null;
  config?: Record<string, unknown>;
  status?: string;
}

export class IntegrationRepository {
  async listByOrganizationId(organizationId: string): Promise<IntegrationInstallation[]> {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("integration_installation")
      .select("*")
      .eq("organization_id", organizationId)
      .order("provider", { ascending: true })
      .order("display_name", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row: unknown) => mapIntegrationRow(row as Record<string, unknown>));
  }

  async findByProvider(organizationId: string, provider: ExternalProvider) {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("integration_installation")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("provider", provider)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return mapIntegrationRow(data as Record<string, unknown>);
  }

  async upsertIntegration(input: UpsertIntegrationInput) {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("integration_installation")
      .upsert(
        {
          organization_id: input.organizationId,
          provider: input.provider,
          display_name: input.displayName,
          external_account_id: input.externalAccountId ?? null,
          config: input.config ?? {},
          status: input.status ?? "active",
        },
        {
          onConflict: "organization_id,provider,display_name",
        },
      )
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return mapIntegrationRow(data as Record<string, unknown>);
  }

  async storeSecret(organizationId: string, installationId: string, keyName: string, secretValue: unknown) {
    const supabase = getSupabaseAdminClient() as any;
    const { error } = await supabase.schema("app_private").from("integration_secret").upsert(
      {
        organization_id: organizationId,
        installation_id: installationId,
        key_name: keyName,
        ciphertext: encryptJson(secretValue),
      },
      {
        onConflict: "installation_id,key_name",
      },
    );

    if (error) {
      throw error;
    }
  }
}
