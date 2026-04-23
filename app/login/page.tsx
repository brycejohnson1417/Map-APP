import { TenantLoginForm } from "@/components/auth/tenant-login-form";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Tenant Login",
  description: "Login for FraterniTees and PICC New York tenant workspaces.",
};

export default function LoginPage() {
  return <TenantLoginForm />;
}

