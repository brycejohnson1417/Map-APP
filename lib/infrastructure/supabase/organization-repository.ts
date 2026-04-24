import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { mapOrganizationRow } from "@/lib/infrastructure/supabase/runtime-mappers";
import type { Organization } from "@/lib/domain/runtime";

export class OrganizationRepository {
  async createOrganization(input: { slug: string; name: string; settings?: Record<string, unknown> }) {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("organization")
      .insert({
        slug: input.slug,
        name: input.name,
        status: "active",
        settings: input.settings ?? {},
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

  async findById(id: string): Promise<Organization | null> {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("organization")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return mapOrganizationRow(data as Record<string, unknown>);
  }

  async listByIds(ids: string[]): Promise<Organization[]> {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (!uniqueIds.length) {
      return [];
    }

    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase.from("organization").select("*").in("id", uniqueIds);

    if (error) {
      throw error;
    }

    return (data ?? []).map((row: unknown) => mapOrganizationRow(row as Record<string, unknown>));
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

  async findFirstByWorkspaceEmailDomain(domain: string, limit = 500): Promise<Organization | null> {
    const normalizedDomain = domain.trim().toLowerCase();
    if (!normalizedDomain) {
      return null;
    }

    const organizations = await this.listActive(limit);
    for (const organization of organizations) {
      const workspaceSettings =
        typeof organization.settings?.workspace === "object" &&
        organization.settings.workspace &&
        !Array.isArray(organization.settings.workspace)
          ? (organization.settings.workspace as Record<string, unknown>)
          : null;
      const overrides =
        workspaceSettings &&
        typeof workspaceSettings.overrides === "object" &&
        workspaceSettings.overrides &&
        !Array.isArray(workspaceSettings.overrides)
          ? (workspaceSettings.overrides as Record<string, unknown>)
          : null;
      const emailDomains = Array.isArray(overrides?.emailDomains)
        ? overrides.emailDomains.filter((value): value is string => typeof value === "string")
        : [];

      if (emailDomains.some((candidate) => candidate.trim().toLowerCase() === normalizedDomain)) {
        return organization;
      }
    }

    return null;
  }
}
