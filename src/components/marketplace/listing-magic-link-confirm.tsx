"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { ListingMagicLinkResend } from "@/components/marketplace/listing-magic-link-resend";
import SmoothButton from "@/components/smoothui/smooth-button";

export function ListingMagicLinkConfirm({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "expired" | "fail">("idle");
  const [hashId, setHashId] = useState<string | null>(null);
  const [alreadyVerified, setAlreadyVerified] = useState(false);

  async function confirm() {
    setStatus("loading");
    const res = await fetch("/api/listing-leads/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setAlreadyVerified(Boolean(data.alreadyVerified));
      setHashId(typeof data.hashId === "string" ? data.hashId : null);
      setStatus("ok");
      return;
    }
    if (res.status === 410) {
      setHashId(typeof data.hashId === "string" ? data.hashId : null);
      setStatus("expired");
      return;
    }
    setStatus("fail");
  }

  if (status === "ok") {
    return (
      <Result
        icon="ok"
        title={alreadyVerified ? "Email already confirmed" : "Email confirmed"}
        body={
          hashId
            ? `SARA Advisors will contact you about ${hashId} after vetting and an NDA. The full data room is never published on this site.`
            : "SARA Advisors will contact you after vetting and an NDA. The full data room is never published on this site."
        }
        href={hashId ? `/marketplace/${hashId}` : "/marketplace"}
      />
    );
  }

  if (status === "expired") {
    return (
      <Result
        icon="expired"
        title="Link expired"
        body="This magic link has expired or was already used. Request a new one below."
        href={hashId ? `/marketplace/${hashId}` : "/marketplace"}
      >
        <ListingMagicLinkResend listingId={hashId ?? undefined} />
      </Result>
    );
  }

  if (status === "fail") {
    return (
      <Result
        icon="fail"
        title="Unable to confirm"
        body="This link is not valid. Request a new magic link from the listing page."
        href="/marketplace"
      />
    );
  }

  return (
    <Result
      icon="ok"
      title="Confirm your work email"
      body="Click below to confirm this profile request. Email previews will not activate the link."
      href="/marketplace"
      hideBack
    >
      <SmoothButton
        type="button"
        variant="candy"
        className="mt-6 w-full"
        disabled={status === "loading"}
        onClick={() => void confirm()}
      >
        {status === "loading" ? "Confirming…" : "Confirm email"}
      </SmoothButton>
    </Result>
  );
}

function Result({
  icon,
  title,
  body,
  href,
  hideBack,
  children,
}: {
  icon: "ok" | "expired" | "fail";
  title: string;
  body: string;
  href: string;
  hideBack?: boolean;
  children?: React.ReactNode;
}) {
  const Icon = icon === "ok" ? CheckCircle2 : icon === "expired" ? Clock : XCircle;
  const iconClass =
    icon === "ok"
      ? "bg-success-bg text-success-fg"
      : icon === "expired"
        ? "bg-warning-bg text-warning-fg"
        : "bg-danger-bg text-danger-fg";

  return (
    <>
      <div className={`mx-auto flex size-12 items-center justify-center rounded-full ${iconClass}`}>
        <Icon className="size-5" aria-hidden />
      </div>
      <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
      <p className="mt-3 text-pretty text-sm leading-relaxed text-foreground/70 sm:text-base">{body}</p>
      {children}
      {hideBack ? null : (
        <SmoothButton asChild variant="candy" className="mt-6 w-full">
          <Link href={href}>Back to listing</Link>
        </SmoothButton>
      )}
    </>
  );
}
