import type { Metadata } from "next";
import { AuthShell } from "@/components/marketing/auth-shell";
import { AuthSessionSync } from "@/components/auth/auth-session-sync";
import { safeCallbackUrl } from "@/lib/auth-utils";

export const metadata: Metadata = {
  title: "Signing in",
};

export default async function AuthSyncPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthShell title="Just a moment" subtitle="We are opening your workspace.">
      <AuthSessionSync callbackUrl={safeCallbackUrl(params.callbackUrl)} />
    </AuthShell>
  );
}
