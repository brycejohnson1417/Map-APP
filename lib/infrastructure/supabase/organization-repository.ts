import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { mapOrganizationRow } from "@/lib/infrastructure/supabase/runtime-mappers";
import type { Organization } from "@/lib/domain/runtime";

export class OrganizationRepository {
  async createOrganization(input: { slug: string; name: string }) {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("organization")
      .insert({
        slug: input.slug,
        name: input.name,
        status: "active",
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return mapOrganizationRow(data as Record<string, unknown>);
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("organization")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }

      throw error;
    }

    return mapOrganizationRow(data as Record<string, unknown>);
  }

  async updateSettings(organizationId: string, settings: Record<string, unknown>): Promise<Organization> {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("organization")
      .update({
        settings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", organizationId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return mapOrganizationRow(data as Record<string, unknown>);
  }

  async listActive(limit = 25): Promise<Organization[]> {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("organization")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data ?? []).map((row: unknown) => mapOrganizationRow(row as Record<string, unknown>));
  }
}
