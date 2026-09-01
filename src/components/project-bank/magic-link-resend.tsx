"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SmoothButton from "@/components/smoothui/smooth-button";

function formatCountdown(total: number) {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function MagicLinkResend({
  email,
  projectId,
}: {
  email?: string;
  projectId?: string;
}) {
  const [value, setValue] = useState(email ?? "");
  const [editing, setEditing] = useState(!email);
  const [loading, setLoading] = useState(false);
  const [wait, setWait] = useState(email ? 120 : 0);

  useEffect(() => {
    if (wait <= 0) return;
    const id = window.setInterval(() => setWait((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [wait > 0]);

  async function send(address: string) {
    if (!projectId) {
      toast.error("Missing project. Open the request from the project page.");
      return;
    }
    if (wait > 0) return;
    setLoading(true);
    const res = await fetch("/api/project-leads/resend-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: address, projectId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    const retryAfter = typeof data.retryAfter === "number" ? data.retryAfter : 0;
    if (retryAfter > 0) setWait(retryAfter);
    if (!res.ok) {
      toast.error(typeof data.error === "string" ? data.error : "Could not resend the link.");
      return;
    }
    if (data.alreadyVerified) {
      toast.success("This email is already confirmed.");
      return;
    }
    toast.success("A new confirmation link is on its way.");
    setEditing(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await send(value);
  }

  const blocked = loading || !projectId || wait > 0;
  const label = loading ? (
    <>
      <Loader2 className="size-4 animate-spin" />
      Sending…
    </>
  ) : wait > 0 ? (
    `Resend in ${formatCountdown(wait)}`
  ) : (
    "Resend confirmation link"
  );

  if (!editing) {
    return (
      <div className="mt-4 space-y-2">
        <SmoothButton
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          disabled={blocked}
          onClick={() => void send(value)}
        >
          {label}
        </SmoothButton>
        <button
          type="button"
          className="w-full text-xs font-medium text-brand-sky hover:underline disabled:opacity-50"
          disabled={wait > 0}
          onClick={() => setEditing(true)}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-2 text-left">
      <div className="space-y-1.5">
        <Label htmlFor="resend-email">Work email</Label>
        <Input
          id="resend-email"
          type="email"
          required
          autoComplete="email"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <SmoothButton type="submit" variant="outline" size="sm" className="w-full" disabled={blocked}>
        {label}
      </SmoothButton>
      {email ? (
        <button
          type="button"
          className="w-full text-xs font-medium text-foreground/55 hover:text-foreground"
          onClick={() => {
            setValue(email);
            setEditing(false);
          }}
        >
          Cancel
        </button>
      ) : null}
    </form>
  );
}
