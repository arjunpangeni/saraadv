import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthShell } from "@/components/marketing/auth-shell";
import { OnboardingRoleForm } from "@/components/auth/onboarding-role-form";
import { authIntentFromCallback, safeCallbackUrl, suggestedRoleFromQuery } from "@/lib/auth-utils";

export const metadata: Metadata = {
  title: "Choose your role",
};

export default async function OnboardingRolePage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; role?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "ADMIN" || session.user.role === "ADVISOR") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  const copy = authIntentFromCallback(callbackUrl);
  const initialRole = suggestedRoleFromQuery(params.role ?? null, copy.suggestedRole);

  return (
    <AuthShell
      title="What do you want to do?"
      subtitle="Choose Seller to list a business, or Project owner to list a project idea."
    >
      <OnboardingRoleForm callbackUrl={callbackUrl} initialRole={initialRole} />
    </AuthShell>
  );
}
