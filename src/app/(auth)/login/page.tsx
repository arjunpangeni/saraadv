import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthShell } from "@/components/marketing/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import {
  authIntentFromCallback,
  googleOAuthEnabled,
  isSignupRole,
  oauthErrorMessage,
  safeCallbackUrl,
} from "@/lib/auth-utils";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
    email?: string;
    verified?: string;
    role?: string;
  }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  if (session?.user) redirect(callbackUrl);

  const copy = authIntentFromCallback(callbackUrl);
  const intentRole = isSignupRole(params.role) ? params.role : copy.suggestedRole;

  return (
    <AuthShell title={copy.title} subtitle={copy.subtitle} compact>
      <LoginForm
        callbackUrl={callbackUrl}
        googleEnabled={googleOAuthEnabled()}
        oauthError={oauthErrorMessage(params.error)}
        initialEmail={params.email}
        verified={params.verified === "1"}
        intentRole={intentRole}
      />
    </AuthShell>
  );
}
