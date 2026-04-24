import { TenantLoginForm } from "@/components/auth/tenant-login-form";
import { listWorkspaceTemplates } from "@/lib/platform/workspace/registry";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Tenant Login",
  description: "Login and onboarding for Map App Harness tenant workspaces.",
};

export default function LoginPage() {
  return <TenantLoginForm templates={listWorkspaceTemplates()} />;
}
