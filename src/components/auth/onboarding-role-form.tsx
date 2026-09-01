"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { RolePicker } from "@/components/auth/role-picker";
import SmoothButton from "@/components/smoothui/smooth-button";
import { FormError } from "@/components/ui/status-banner";
import { safeCallbackUrl, type SignupRole } from "@/lib/auth-utils";

export function OnboardingRoleForm({ callbackUrl, initialRole }: { callbackUrl: string; initialRole: SignupRole }) {
  const router = useRouter();
  const { update } = useSession();
  const next = safeCallbackUrl(callbackUrl);
  const [role, setRole] = useState<SignupRole>(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not save your choice.");
      setLoading(false);
      return;
    }
    await update();
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <RolePicker value={role} onChange={setRole} />
      <FormError>{error}</FormError>
      <SmoothButton type="submit" variant="candy" size="lg" className="w-full min-h-12" disabled={loading}>
        {loading ? "Saving..." : "Continue"}
      </SmoothButton>
    </form>
  );
}
