"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SmoothButton from "@/components/smoothui/smooth-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/status-banner";
import { AuthDivider, GoogleButton } from "@/components/auth/google-button";
import { safeCallbackUrl, type SignupRole } from "@/lib/auth-utils";

export function LoginForm({
  callbackUrl,
  googleEnabled,
  oauthError,
  initialEmail,
  verified,
  intentRole,
}: {
  callbackUrl: string;
  googleEnabled: boolean;
  oauthError?: string | null;
  initialEmail?: string;
  verified?: boolean;
  intentRole?: SignupRole | null;
}) {
  const router = useRouter();
  const next = safeCallbackUrl(callbackUrl);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(oauthError ?? null);
  const [loading, setLoading] = useState<"google" | "email" | null>(null);

  async function rememberIntent(role?: SignupRole) {
    await fetch("/api/auth/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, callbackUrl: next }),
    });
  }

  async function onGoogle() {
    setError(null);
    setLoading("google");
    try {
      await rememberIntent(intentRole ?? undefined);
      await signIn("google", { callbackUrl: `/auth/complete?callbackUrl=${encodeURIComponent(next)}` });
    } catch {
      setError("Could not start Google sign-in. Try again.");
    } finally {
      setLoading(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading("email");
    setError(null);

    const check = await fetch("/api/auth/credentials-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await check.json().catch(() => ({}));

    if (data.status === "unverified") {
      router.push(
        `/verify-email?email=${encodeURIComponent(data.email || email)}&callbackUrl=${encodeURIComponent(next)}`
      );
      return;
    }
    if (data.status !== "ok") {
      setError(typeof data.error === "string" ? data.error : "Invalid email or password.");
      setLoading(null);
      return;
    }

    const res = await signIn("credentials", { email, password, redirect: false, callbackUrl: next });
    if (res?.error) {
      setError("Invalid email or password.");
      setLoading(null);
      return;
    }
    window.location.assign(`/auth/sync?callbackUrl=${encodeURIComponent(next)}`);
  }

  const registerHref = intentRole
    ? `/register?callbackUrl=${encodeURIComponent(next)}&role=${encodeURIComponent(intentRole)}`
    : `/register?callbackUrl=${encodeURIComponent(next)}`;

  return (
    <div className="space-y-3">
      {verified ? (
        <p className="rounded-md border border-border bg-success-bg px-2.5 py-1.5 text-xs text-success-fg">
          Email verified. Sign in to continue.
        </p>
      ) : null}
      {googleEnabled ? (
        <>
          <GoogleButton onClick={onGoogle} loading={loading === "google"} />
          <p className="text-center text-[11px] leading-snug text-muted-foreground">
            New with Google?{" "}
            <Link href={registerHref} className="font-semibold text-brand-sky hover:underline">
              Sign up and choose Seller or Project owner
            </Link>{" "}
            first.
          </p>
          <AuthDivider />
        </>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="email" className="text-xs">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password" className="text-xs">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-9"
          />
        </div>
        <FormError>{error}</FormError>
        <SmoothButton type="submit" variant="candy" size="sm" className="w-full" disabled={loading !== null}>
          {loading === "email" ? "Signing in..." : "Sign in"}
        </SmoothButton>
      </form>

      <div className="space-y-1.5">
        <p className="text-center text-xs text-muted-foreground">No account?</p>
        <SmoothButton asChild variant="outline" size="sm" className="w-full">
          <Link href={registerHref}>Sign up</Link>
        </SmoothButton>
      </div>
    </div>
  );
}
