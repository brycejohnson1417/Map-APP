import { NextResponse } from "next/server";
import { z } from "zod";
import {
  writeTenantSessionCookies,
} from "@/lib/application/auth/tenant-access";
import { bootstrapOrganization } from "@/lib/application/runtime/bootstrap-service";
import { OrganizationRepository } from "@/lib/infrastructure/supabase/organization-repository";
import { findWorkspaceTemplateById } from "@/lib/platform/workspace/registry";
import { orgScopedHref } from "@/lib/presentation/org-slug";

const organizations = new OrganizationRepository();

const schema = z.object({
  templateId: z.string().min(1),
  email: z.string().email(),
  companyName: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9-]+$/, "Slug must use lowercase letters, numbers, and hyphens."),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid onboarding payload." }, { status: 400 });
  }

  const template = findWorkspaceTemplateById(parsed.data.templateId);
  if (!template) {
    return NextResponse.json({ ok: false, error: `Unknown template "${parsed.data.templateId}".` }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const domain = email.split("@")[1] ?? "";
  if (!template.selfServe && !template.emailDomains.some((candidate) => candidate.toLowerCase() === domain)) {
    return NextResponse.json(
      { ok: false, error: "This template currently requires a guided setup domain." },
      { status: 403 },
    );
  }

  const existing = await organizations.findBySlug(parsed.data.slug);
  if (existing) {
    return NextResponse.json({ ok: false, error: `Slug "${parsed.data.slug}" is already in use.` }, { status: 409 });
  }

  const { organization } = await bootstrapOrganization({
    slug: parsed.data.slug,
    name: parsed.data.companyName.trim(),
    settings: {
      workspace: {
        templateId: template.id,
        overrides: {
          emailDomains: domain ? [domain] : [],
        },
      },
    },
    owner: {
      clerkUserId: `tenant:${email}`,
      email,
      fullName: null,
      role: "owner",
    },
  });

  await writeTenantSessionCookies({
    email,
    slug: organization.slug,
    templateId: template.id,
  });

  const redirectTo = template.connectors.length
    ? orgScopedHref("/integrations", organization.slug)
    : orgScopedHref(template.defaultRedirectPath, organization.slug);

  return NextResponse.json({
    ok: true,
    organization: {
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
    },
    redirectTo,
  });
}
