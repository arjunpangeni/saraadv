"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SmoothButton from "@/components/smoothui/smooth-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/status-banner";
import { safeCallbackUrl } from "@/lib/auth-utils";

const PENDING_PASSWORD_KEY = "sara-pending-password";

export function storePendingPassword(password: string) {
  try {
    sessionStorage.setItem(PENDING_PASSWORD_KEY, password);
  } catch {
    /* ignore */
  }
}

export function VerifyEmailForm({
  email,
  callbackUrl,
}: {
  email: string;
  callbackUrl: string;
}) {
  const router = useRouter();
  const next = safeCallbackUrl(callbackUrl);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState<"verify" | "resend" | null>(null);

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading("verify");
    setError(null);
    setInfo(null);

    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not verify that code.");
      setLoading(null);
      return;
    }

    let password = "";
    try {
      password = sessionStorage.getItem(PENDING_PASSWORD_KEY) ?? "";
      sessionStorage.removeItem(PENDING_PASSWORD_KEY);
    } catch {
      password = "";
    }

    const completeUrl = `/auth/complete?callbackUrl=${encodeURIComponent(next)}`;

    if (password) {
      const signed = await signIn("credentials", { email, password, redirect: false, callbackUrl: completeUrl });
      if (!signed?.error) {
        router.push(completeUrl);
        router.refresh();
        return;
      }
    }

    router.push(
      `/login?verified=1&callbackUrl=${encodeURIComponent(completeUrl)}&email=${encodeURIComponent(email)}`
    );
  }

  async function onResend() {
    setLoading("resend");
    setError(null);
    setInfo(null);
    const res = await fetch("/api/auth/otp/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(null);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not resend the code.");
      return;
    }
    setInfo("A new code is on the way. Check your inbox.");
  }

  return (
    <form onSubmit={onVerify} className="space-y-5">
      <p className="text-sm leading-relaxed text-foreground/70">
        We sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>. Enter it below to
        finish creating your account.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="code">Verification code</Label>
        <Input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="tracking-[0.4em] text-center text-lg font-semibold"
        />
      </div>
      <FormError>{error}</FormError>
      {info ? <p className="text-sm text-success-fg">{info}</p> : null}
      <SmoothButton
        type="submit"
        variant="candy"
        size="lg"
        className="w-full min-h-12"
        disabled={loading !== null || code.length !== 6}
      >
        {loading === "verify" ? "Verifying..." : "Verify email"}
      </SmoothButton>
      <button
        type="button"
        onClick={onResend}
        disabled={loading !== null}
        className="w-full text-sm font-semibold text-brand-sky hover:underline disabled:opacity-50"
      >
        {loading === "resend" ? "Sending..." : "Resend code"}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        Wrong email?{" "}
        <Link href={`/register?callbackUrl=${encodeURIComponent(next)}`} className="text-brand-sky font-semibold hover:underline">
          Go back
        </Link>
      </p>
    </form>
  );
}
