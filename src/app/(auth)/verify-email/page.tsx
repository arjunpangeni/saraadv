import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/marketing/auth-shell";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { safeCallbackUrl } from "@/lib/auth-utils";

export const metadata: Metadata = {
  title: "Verify your email",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const email = params.email?.trim().toLowerCase() ?? "";
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  if (!email) redirect(`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`);

  return (
    <AuthShell title="Verify your email" subtitle="Enter the 6-digit code we sent. Codes expire in 10 minutes.">
      <VerifyEmailForm email={email} callbackUrl={callbackUrl} />
    </AuthShell>
  );
}
