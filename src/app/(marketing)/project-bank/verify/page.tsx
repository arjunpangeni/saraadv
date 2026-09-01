import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { MagicLinkConfirm } from "@/components/project-bank/magic-link-confirm";
import SmoothButton from "@/components/smoothui/smooth-button";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Confirm email | Project Bank",
    description: "Confirm your work email for a Project Bank dossier request.",
    path: "/project-bank/verify",
  }),
  robots: { index: false, follow: false },
};

export default async function VerifyProjectLeadPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; already?: string; project?: string }>;
}) {
  const { token, already, project } = await searchParams;

  if (already === "1") {
    return (
      <VerifyShell
        icon="ok"
        title="Request already on file"
        body="This work email is already confirmed. SARA Advisors will contact you about the dossier."
        href={project ? `/project-bank/${project}` : "/project-bank/discover"}
      />
    );
  }

  if (!token) {
    return (
      <VerifyShell
        icon="fail"
        title="Link missing"
        body="Open the confirm button in the email we sent, or request a new magic link from the project page."
        href="/project-bank/discover"
      />
    );
  }

  return (
    <main className="flex-1 bg-background">
      <div className="container-page max-w-lg py-16 sm:py-20">
        <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-[var(--shadow-card)] sm:px-10">
          <MagicLinkConfirm token={token} />
        </div>
      </div>
    </main>
  );
}

function VerifyShell({
  icon,
  title,
  body,
  href,
  children,
}: {
  icon: "ok" | "expired" | "fail";
  title: string;
  body: string;
  href: string;
  children?: ReactNode;
}) {
  const Icon = icon === "ok" ? CheckCircle2 : icon === "expired" ? Clock : XCircle;
  const iconClass =
    icon === "ok" ? "bg-success-bg text-success-fg" : icon === "expired" ? "bg-warning-bg text-warning-fg" : "bg-danger-bg text-danger-fg";

  return (
    <main className="flex-1 bg-background">
      <div className="container-page max-w-lg py-16 sm:py-20">
        <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-[var(--shadow-card)] sm:px-10">
          <div className={`mx-auto flex size-12 items-center justify-center rounded-full ${iconClass}`}>
            <Icon className="size-5" aria-hidden />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-foreground/70 sm:text-base">{body}</p>
          {children}
          <SmoothButton asChild variant="candy" className="mt-6 w-full">
            <Link href={href}>Back to project</Link>
          </SmoothButton>
        </div>
      </div>
    </main>
  );
}
