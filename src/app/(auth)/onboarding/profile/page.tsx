import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthShell } from "@/components/marketing/auth-shell";
import { OnboardingProfileForm } from "@/components/auth/onboarding-profile-form";
import { hasUsablePhone, safeCallbackUrl } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { isDeskRole } from "@/lib/rbac";

export const metadata: Metadata = {
  title: "Add your phone number",
};

export default async function OnboardingProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);

  if (isDeskRole(session.user.role)) {
    redirect(callbackUrl);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true },
  });

  if (hasUsablePhone(user?.phone)) {
    redirect(`/auth/sync?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return (
    <AuthShell
      title="Add your mobile number"
      subtitle="Google does not share a phone number. We need one so the ASAR desk can reach you about your listing or project."
    >
      <OnboardingProfileForm callbackUrl={callbackUrl} />
    </AuthShell>
  );
}
