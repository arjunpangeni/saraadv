import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthShell } from "@/components/marketing/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import {
  authIntentFromCallback,
  googleOAuthEnabled,
  resolveSignedInDestination,
  safeCallbackUrl,
  suggestedRoleFromQuery,
  withPhoneGate,
} from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Create an account",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; role?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true, role: true },
    });
    const dest = resolveSignedInDestination(user?.role ?? session.user.role, callbackUrl);
    redirect(withPhoneGate(dest, { phone: user?.phone, role: user?.role ?? session.user.role }));
  }
  const copy = authIntentFromCallback(callbackUrl);
  const initialRole = suggestedRoleFromQuery(params.role ?? null, copy.suggestedRole);

  return (
    <AuthShell compact bare>
      <RegisterForm callbackUrl={callbackUrl} initialRole={initialRole} googleEnabled={googleOAuthEnabled()} />
    </AuthShell>
  );
}
