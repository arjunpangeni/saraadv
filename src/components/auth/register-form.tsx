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
import { RolePicker } from "@/components/auth/role-picker";
import { storePendingPassword } from "@/components/auth/verify-email-form";
import { AuthCard } from "@/components/auth/auth-card";
import { googleContinueLabel, postAuthDestination, type SignupRole } from "@/lib/auth-utils";

export function RegisterForm({
  callbackUrl,
  initialRole,
  googleEnabled,
}: {
  callbackUrl: string;
  initialRole: SignupRole;
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: initialRole });
  const next = postAuthDestination(form.role, callbackUrl);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"google" | "email" | null>(null);

  async function rememberIntent() {
    await fetch("/api/auth/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: form.role, callbackUrl: next }),
    });
  }

  async function onGoogle() {
    setError(null);
    setLoading("google");
    try {
      await rememberIntent();
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

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, callbackUrl: next }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok && !data.needsVerification) {
      setError(typeof data.error === "string" ? data.error : "Registration failed.");
      setLoading(null);
      return;
    }

    await rememberIntent();
    storePendingPassword(form.password);
    router.push(
      `/verify-email?email=${encodeURIComponent(data.email || form.email)}&callbackUrl=${encodeURIComponent(next)}`
    );
  }

  return (
    <div className="space-y-2.5">
      <AuthCard className="p-3">
        <RolePicker value={form.role} onChange={(role) => setForm({ ...form, role })} compact />
      </AuthCard>

      <AuthCard className="p-3.5">
        <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground">Create your account</h2>
        <p className="mt-0.5 text-xs text-foreground/70">
          Google uses the role you picked above. Email sends a one-time code.
        </p>

        <div className="mt-3 space-y-3">
          {googleEnabled ? (
            <>
              <GoogleButton
                onClick={onGoogle}
                loading={loading === "google"}
                label={googleContinueLabel(form.role)}
              />
              <AuthDivider />
            </>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs">
                  Full name
                </Label>
                <Input
                  id="name"
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="h-9"
              />
              <p className="text-[11px] text-muted-foreground">Min. 12 characters.</p>
            </div>
            <FormError>{error}</FormError>
            <SmoothButton type="submit" variant="candy" size="sm" className="w-full" disabled={loading !== null}>
              {loading === "email" ? "Sending code..." : "Create account"}
            </SmoothButton>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(next)}`}
              className="font-semibold text-brand-sky hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </AuthCard>
    </div>
  );
}
