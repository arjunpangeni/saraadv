import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { maskEmail } from "@/lib/listing-magic-link";
import { prisma } from "@/lib/prisma";
import { ListingMagicLinkResend } from "@/components/marketplace/listing-magic-link-resend";
import SmoothButton from "@/components/smoothui/smooth-button";
import { PageBreadcrumbs } from "@/components/marketing/page-breadcrumbs";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Check your email | Marketplace",
    description: "Confirm your work email with the link from SARA Advisors.",
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
    <main className="flex-1 bg-background">
      <div className="container-page py-6 sm:py-8">
        <PageBreadcrumbs items={crumbs} />

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium tracking-tight text-brand-sky">M&A Marketplace</p>
            <h1 className="mt-1 text-pretty font-display text-3xl font-extrabold tracking-tight text-foreground">
              Check your inbox
            </h1>
          </div>
          <SmoothButton asChild variant="outline" size="sm">
            <Link href={listingHref}>{listing ? "Back to listing" : "Browse marketplace"}</Link>
          </SmoothButton>
        </div>

        <div className="mt-6 space-y-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start lg:gap-10 lg:space-y-0">
          <div className="min-w-0 rounded-2xl border border-success/30 bg-success-bg/40 px-5 py-5">
            <p className="text-[11px] font-semibold tracking-wide text-success-fg uppercase">Request received</p>
            <p className="mt-2 text-pretty text-base leading-relaxed text-foreground/75">
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
            <p className="mt-3 text-pretty text-base leading-relaxed text-foreground/75">
              After you confirm, SARA Advisors vet the request, arrange an NDA, and share the data
              room offline.
            </p>
          </div>

          <aside className="rounded-2xl border border-brand-sky/30 bg-brand-sky-muted px-5 py-5">
            <p className="text-[11px] font-semibold tracking-wide text-brand-sky uppercase">Next step</p>
            <p className="mt-1 text-sm font-semibold text-foreground">Confirmation sent</p>
            <p className="mt-1 break-all text-sm text-foreground/70">{masked}</p>
            <p className="mt-2 text-xs text-foreground/55">Check spam if you do not see it.</p>
            <ListingMagicLinkResend email={email} listingId={listingParam} />
          </aside>
        </div>
      </div>
    </main>
  );
}
