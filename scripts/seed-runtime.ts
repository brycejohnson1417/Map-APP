import { z } from "zod";
import { bootstrapOrganization, registerIntegration } from "@/lib/application/runtime/bootstrap-service";
import { getApplicationEncryptionKey, getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/config";

const envSchema = z.object({
  ORG_SLUG: z.string().min(2),
  ORG_NAME: z.string().min(2),
  OWNER_CLERK_ID: z.string().min(3),
  OWNER_EMAIL: z.string().email(),
  OWNER_NAME: z.string().optional(),
  NOTION_TOKEN: z.string().optional(),
  NOTION_WORKSPACE_ID: z.string().optional(),
  NOTION_DATA_SOURCE_IDS: z.string().optional(),
  NABIS_API_KEY: z.string().optional(),
});

function parseJsonArray(raw?: string) {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }
}

async function main() {
  if (!getSupabaseUrl() || !getSupabaseServiceRoleKey()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required");
  }

  if (!getApplicationEncryptionKey()) {
    throw new Error("APP_ENCRYPTION_KEY is required for encrypted connector secrets");
  }

  const env = envSchema.parse(process.env);

  const { organization } = await bootstrapOrganization({
    slug: env.ORG_SLUG,
    name: env.ORG_NAME,
    owner: {
      clerkUserId: env.OWNER_CLERK_ID,
      email: env.OWNER_EMAIL,
      fullName: env.OWNER_NAME ?? null,
      role: "owner",
    },
  });

  if (env.NOTION_TOKEN) {
    await registerIntegration({
      organizationId: organization.id,
      provider: "notion",
      displayName: "Notion CRM",
      externalAccountId: env.NOTION_WORKSPACE_ID ?? null,
      config: {
        dataSourceIds: parseJsonArray(env.NOTION_DATA_SOURCE_IDS),
      },
      secrets: {
        token: env.NOTION_TOKEN,
      },
    });
  }

  if (env.NABIS_API_KEY) {
    await registerIntegration({
      organizationId: organization.id,
      provider: "nabis",
      displayName: "Nabis Orders",
      config: {},
      secrets: {
        apiKey: env.NABIS_API_KEY,
      },
    });
  }

  console.log(`Seeded organization ${organization.slug} (${organization.id})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
