import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { maskEmail } from "@/lib/project-bank-magic-link";
import { findPublishedTeaserMeta } from "@/lib/project-bank";
import { MagicLinkResend } from "@/components/project-bank/magic-link-resend";
import SmoothButton from "@/components/smoothui/smooth-button";
import { PageBreadcrumbs } from "@/components/marketing/page-breadcrumbs";
import { PageIntro } from "@/components/marketing/page-intro";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Check your email | Project Bank",
    description: "Confirm your work email with the link from ASAR Partners.",
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
    <main className="flex-1">
      <div className="container-page py-16 sm:py-20">
        <PageBreadcrumbs items={crumbs} />

        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <PageIntro eyebrow="Project Bank" title="Check your inbox" />
          <SmoothButton asChild variant="outline" size="sm">
            <Link href={projectHref}>{teaser ? "Back to project" : "Browse projects"}</Link>
          </SmoothButton>
        </div>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-10">
          <div className="min-w-0 max-w-2xl">
            <p className="text-pretty text-[1.05rem] leading-[1.75] text-muted-foreground">
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
            <p className="mt-3 text-pretty text-[1.05rem] leading-[1.75] text-muted-foreground">
              After you confirm, ASAR Partners vet the request, arrange an NDA, and share the
              dossier offline.
            </p>
          </div>

          <aside className="rounded-3xl border border-border bg-card px-6 py-6 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold tracking-[0.2em] text-tz-blue-deep uppercase">Next step</p>
            <p className="heading-soft mt-2 font-heading text-lg font-semibold tracking-[-0.015em] text-foreground">Confirmation sent</p>
            <p className="mt-1 break-all text-[1.05rem] leading-[1.75] text-muted-foreground">{masked}</p>
            <p className="mt-2 text-sm text-muted-foreground">Check spam if you do not see it.</p>
            <MagicLinkResend email={email} projectId={projectParam} />
          </aside>
        </div>
      </div>
    </main>
  );
}
