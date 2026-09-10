import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { maskEmail } from "@/lib/listing-magic-link";
import { prisma } from "@/lib/prisma";
import { ListingMagicLinkResend } from "@/components/marketplace/listing-magic-link-resend";
import SmoothButton from "@/components/smoothui/smooth-button";
import { PageBreadcrumbs } from "@/components/marketing/page-breadcrumbs";
import { PageIntro } from "@/components/marketing/page-intro";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Check your email | Marketplace",
    description: "Confirm your work email with the link from ASAR Partners.",
    path: "/marketplace/request/check-email",
  }),
  robots: { index: false, follow: false },
};

export default async function ListingCheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; listing?: string }>;
}) {
  const { email, listing: listingParam } = await searchParams;
  const masked = email ? maskEmail(email) : "your inbox";
  const listing = listingParam
    ? await prisma.listing.findFirst({
        where: { hashId: listingParam, status: "PUBLISHED" },
        select: { hashId: true },
      })
    : null;
  const listingHref = listing
    ? `/marketplace/${listing.hashId}`
    : listingParam
      ? `/marketplace/${listingParam}`
      : "/marketplace";

  const crumbs = [
    { name: "Marketplace", href: "/marketplace" },
    ...(listing ? [{ name: listing.hashId, href: listingHref }] : []),
    { name: "Check email" },
  ];

  return (
    <main className="flex-1">
      <div className="container-page py-16 sm:py-20">
        <PageBreadcrumbs items={crumbs} />

        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <PageIntro eyebrow="M&A Marketplace" title="Check your inbox" />
          <SmoothButton asChild variant="outline" size="sm">
            <Link href={listingHref}>{listing ? "Back to listing" : "Browse marketplace"}</Link>
          </SmoothButton>
        </div>

        <div className="mt-10 space-y-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start lg:gap-10 lg:space-y-0">
          <div className="min-w-0 rounded-3xl border border-success/30 bg-success-bg/40 px-6 py-6">
            <p className="text-xs font-semibold tracking-[0.2em] text-success-fg uppercase">Request received</p>
            <p className="mt-3 text-pretty text-[1.05rem] leading-[1.75] text-muted-foreground">
              We sent a confirmation link to{" "}
              <span className="font-semibold text-foreground">{masked}</span>
              {listing ? (
                <>
                  {" "}
                  for <span className="font-semibold text-foreground">{listing.hashId}</span>
                </>
              ) : null}
              . Open that email and click the link — no password. It expires in 24 hours.
            </p>
            <p className="mt-3 text-pretty text-[1.05rem] leading-[1.75] text-muted-foreground">
              After you confirm, ASAR Partners vet the request, arrange an NDA, and share the data
              room offline.
            </p>
          </div>

          <aside className="rounded-3xl border border-border bg-card px-6 py-6 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold tracking-[0.2em] text-tz-blue-deep uppercase">Next step</p>
            <p className="heading-soft mt-2 font-heading text-lg font-semibold tracking-[-0.015em] text-foreground">Confirmation sent</p>
            <p className="mt-1 break-all text-[1.05rem] leading-[1.75] text-muted-foreground">{masked}</p>
            <p className="mt-2 text-sm text-muted-foreground">Check spam if you do not see it.</p>
            <ListingMagicLinkResend email={email} listingId={listingParam} />
          </aside>
        </div>
      </div>
    </main>
  );
}
