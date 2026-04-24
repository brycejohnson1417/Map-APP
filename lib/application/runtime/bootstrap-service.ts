import "server-only";

import { IntegrationRepository } from "@/lib/infrastructure/supabase/integration-repository";
import { OrganizationMemberRepository } from "@/lib/infrastructure/supabase/organization-member-repository";
import { OrganizationRepository } from "@/lib/infrastructure/supabase/organization-repository";
import type { ExternalProvider, MembershipRole } from "@/lib/domain/runtime";

const organizations = new OrganizationRepository();
const members = new OrganizationMemberRepository();
const integrations = new IntegrationRepository();

export async function bootstrapOrganization(input: {
  slug: string;
  name: string;
  settings?: Record<string, unknown>;
  owner: {
    clerkUserId: string;
    email: string;
    fullName?: string | null;
    role?: MembershipRole;
  };
}) {
  let organization = await organizations.findBySlug(input.slug);

  if (!organization) {
    organization = await organizations.createOrganization({
      slug: input.slug,
      name: input.name,
      settings: input.settings,
    });
  } else if (input.settings && JSON.stringify(organization.settings) !== JSON.stringify(input.settings)) {
    organization = await organizations.updateSettings(organization.id, {
      ...organization.settings,
      ...input.settings,
    });
  }

  const ownerRole: MembershipRole = input.owner.role ?? "owner";
  const member = await members.upsertMember({
    organizationId: organization.id,
    clerkUserId: input.owner.clerkUserId,
    email: input.owner.email,
    fullName: input.owner.fullName ?? null,
    role: ownerRole,
  });

  return { organization, member };
}

export async function registerIntegration(input: {
  organizationId: string;
  provider: ExternalProvider;
  displayName: string;
  externalAccountId?: string | null;
  config?: Record<string, unknown>;
  secrets?: Record<string, unknown>;
}) {
  const installation = await integrations.upsertIntegration({
    organizationId: input.organizationId,
    provider: input.provider,
    displayName: input.displayName,
    externalAccountId: input.externalAccountId ?? null,
    config: input.config ?? {},
  });

  if (input.secrets) {
    const entries = Object.entries(input.secrets);
    for (const [key, value] of entries) {
      await integrations.storeSecret(input.organizationId, installation.id, key, value);
    }
  }

  return installation;
}
