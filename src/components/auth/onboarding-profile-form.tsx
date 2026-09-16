"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import SmoothButton from "@/components/smoothui/smooth-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/status-banner";
import { safeCallbackUrl } from "@/lib/auth-utils";
import { sanitizePhoneInput } from "@/lib/phone";

export function OnboardingProfileForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const { update } = useSession();
  const next = safeCallbackUrl(callbackUrl);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not save your phone number.");
      setLoading(false);
      return;
    }
    await update();
    router.push(`/auth/sync?callbackUrl=${encodeURIComponent(next)}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="phone">Mobile number</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          placeholder="+977 98XXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          Include country code. Advisors use this to follow up on listings and Project Bank requests.
        </p>
      </div>
      <FormError>{error}</FormError>
      <SmoothButton type="submit" variant="candy" size="lg" className="w-full min-h-12" disabled={loading}>
        {loading ? "Saving..." : "Continue"}
      </SmoothButton>
    </form>
  );
}
