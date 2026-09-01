"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { MagicLinkResend } from "@/components/project-bank/magic-link-resend";
import SmoothButton from "@/components/smoothui/smooth-button";

export function MagicLinkConfirm({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "expired" | "fail">("idle");
  const [projectSlug, setProjectSlug] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState<string | null>(null);
  const [alreadyVerified, setAlreadyVerified] = useState(false);

  async function confirm() {
    setStatus("loading");
    const res = await fetch("/api/project-leads/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setAlreadyVerified(Boolean(data.alreadyVerified));
      setProjectSlug(typeof data.projectSlug === "string" ? data.projectSlug : null);
      setProjectTitle(typeof data.projectTitle === "string" ? data.projectTitle : null);
      setStatus("ok");
      return;
    }
    if (res.status === 410) {
      setProjectSlug(typeof data.projectSlug === "string" ? data.projectSlug : null);
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
          projectTitle
            ? `SARA Advisors will contact you about "${projectTitle}" after vetting and an NDA. The full dossier is never published on this site.`
            : "SARA Advisors will contact you after vetting and an NDA. The full dossier is never published on this site."
        }
        href={projectSlug ? `/project-bank/${projectSlug}` : "/project-bank/discover"}
      />
    );
  }

  if (status === "expired") {
    return (
      <Result
        icon="expired"
        title="Link expired"
        body="This magic link has expired or was already used. Request a new one below."
        href={projectSlug ? `/project-bank/${projectSlug}` : "/project-bank/discover"}
      >
        <MagicLinkResend projectId={projectSlug ?? undefined} />
      </Result>
    );
  }

  if (status === "fail") {
    return (
      <Result
        icon="fail"
        title="Unable to confirm"
        body="This link is not valid. Request a new magic link from the project page."
        href="/project-bank/discover"
      />
    );
  }

  return (
    <Result
      icon="ok"
      title="Confirm your work email"
      body="Click below to confirm this dossier request. Email previews will not activate the link."
      href="/project-bank/discover"
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
          <Link href={href}>Back to project</Link>
        </SmoothButton>
      )}
    </>
  );
}
