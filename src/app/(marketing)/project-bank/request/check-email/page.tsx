import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { maskEmail } from "@/lib/project-bank-magic-link";
import { findPublishedTeaserMeta } from "@/lib/project-bank";
import { MagicLinkResend } from "@/components/project-bank/magic-link-resend";
import SmoothButton from "@/components/smoothui/smooth-button";
import { PageBreadcrumbs } from "@/components/marketing/page-breadcrumbs";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Check your email | Project Bank",
    description: "Confirm your work email with the link from SARA Advisors.",
    path: "/project-bank/request/check-email",
  }),
  robots: { index: false, follow: false },
};

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; project?: string }>;
}) {
  const { email, project: projectParam } = await searchParams;
  const masked = email ? maskEmail(email) : "your inbox";
  const teaser = projectParam ? await findPublishedTeaserMeta(projectParam) : null;
  const projectHref = teaser
    ? `/project-bank/${teaser.slug}`
    : projectParam
      ? `/project-bank/${projectParam}`
      : "/project-bank/discover";

  const crumbs = [
    { name: "Project Bank", href: "/project-bank" },
    { name: "Discover", href: "/project-bank/discover" },
    ...(teaser ? [{ name: teaser.title, href: projectHref }] : []),
    { name: "Check email" },
  ];

  return (
    <main className="flex-1 bg-background">
      <div className="container-page py-6 sm:py-8">
        <PageBreadcrumbs items={crumbs} />

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium tracking-tight text-brand-sky">Project Bank</p>
            <h1 className="mt-1 text-pretty font-display text-3xl font-extrabold tracking-tight text-foreground">
              Check your inbox
            </h1>
          </div>
          <SmoothButton asChild variant="outline" size="sm">
            <Link href={projectHref}>{teaser ? "Back to project" : "Browse projects"}</Link>
          </SmoothButton>
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-10">
          <div className="min-w-0 max-w-2xl">
            <p className="text-pretty text-base leading-relaxed text-foreground/75">
              We sent a confirmation link to{" "}
              <span className="font-semibold text-foreground">{masked}</span>
              {teaser ? (
                <>
                  {" "}
                  for <span className="font-semibold text-foreground">{teaser.title}</span>
                </>
              ) : null}
              . Open that email and click the link — no password. It expires in 24 hours.
            </p>
            <p className="mt-3 text-pretty text-base leading-relaxed text-foreground/75">
              After you confirm, SARA Advisors vet the request, arrange an NDA, and share the
              dossier offline.
            </p>
          </div>

          <aside className="rounded-2xl border border-brand-sky/30 bg-brand-sky-muted px-5 py-5">
            <p className="text-[11px] font-semibold tracking-wide text-brand-sky uppercase">Next step</p>
            <p className="mt-1 text-sm font-semibold text-foreground">Confirmation sent</p>
            <p className="mt-1 break-all text-sm text-foreground/70">{masked}</p>
            <p className="mt-2 text-xs text-foreground/55">Check spam if you do not see it.</p>
            <MagicLinkResend email={email} projectId={projectParam} />
          </aside>
        </div>
      </div>
    </main>
  );
}
