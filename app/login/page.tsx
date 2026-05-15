import { TenantLoginForm } from "@/components/auth/tenant-login-form";
import { listWorkspaceTemplates } from "@/lib/platform/workspace/registry";
import { firstParamValue } from "@/lib/presentation/org-slug";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Tenant Login",
  description: "Login and onboarding for Map App Harness tenant workspaces.",
};

interface LoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const requestedOrgSlug = firstParamValue(resolvedSearchParams.org)?.trim() || null;
  return <TenantLoginForm templates={listWorkspaceTemplates()} requestedOrgSlug={requestedOrgSlug} />;
}
