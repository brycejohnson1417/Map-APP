import { WorkspaceOnboardingForm } from "@/components/onboarding/workspace-onboarding-form";
import { listWorkspaceTemplates } from "@/lib/platform/workspace/registry";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Workspace Onboarding",
  description: "Bootstrap a new tenant workspace from a reusable Map App Harness template.",
};

interface OnboardingPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function firstParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};

  return (
    <WorkspaceOnboardingForm
      templates={listWorkspaceTemplates()}
      defaultTemplateId={firstParamValue(resolvedSearchParams.templateId)}
      defaultEmail={firstParamValue(resolvedSearchParams.email)}
    />
  );
}
