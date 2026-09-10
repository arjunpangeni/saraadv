import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { MarketplaceFilterBar } from "@/components/marketplace/filter-bar";
import { ListingCardGrid } from "@/components/marketplace/listing-card-grid";
import SmoothButton from "@/components/smoothui/smooth-button";
import { getPublicListings, parseMarketplaceSort } from "@/lib/listings";
import type { DealValueBand } from "@/lib/calc";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/marketing/page-hero";
import { pageMetadata, itemListJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = pageMetadata({
  title: "M&A Marketplace - Anonymized Business Listings in Nepal",
  description:
    "Browse anonymized, verified business acquisition opportunities across Nepal. Filter by sector, deal value, profitability, and location. Sign an NDA to unlock full due-diligence data.",
  path: "/marketplace",
  ogTitle: "M&A marketplace | Anonymized business listings in Nepal",
});

export const revalidate = 60;

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const hasActiveQuery = Boolean(sp.industry || sp.dealValueBand || sp.province);

  const listings = await getPublicListings({
    industry: sp.industry,
    dealValueBand: sp.dealValueBand as DealValueBand | undefined,
    province: sp.province,
    sort: parseMarketplaceSort(sp.sort),
  });

  return (
    <main className="flex-1">
      {listings.length > 0 ? (
        <JsonLd
          data={itemListJsonLd({
            name: "Anonymized M&A listings in Nepal",
            description: "Advisor-reviewed business opportunities. Identities stay gated until an NDA.",
            path: "/marketplace",
            items: listings.map((l) => ({
              name: l.hashId,
              url: `${siteConfig.url}/marketplace/${l.hashId}`,
            })),
          })}
        />
      ) : null}

      <PageHero
        eyebrow="M&A Marketplace"
        title="Anonymized opportunities"
        description="Company names stay hidden. Request a profile with a work email — ASAR Partners arranges an NDA before anything confidential is shared."
      />

      <section className="container-page pb-20 sm:pb-28">
        <Suspense fallback={<div className="mb-6 h-28 animate-pulse rounded-3xl border border-border bg-card sm:h-24" />}>
          <MarketplaceFilterBar resultCount={listings.length} />
        </Suspense>

        {listings.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={hasActiveQuery ? "No listings match your filters" : "No published opportunities yet"}
            description={
              hasActiveQuery
                ? "Try a broader search, remove a filter chip, or clear everything and browse again."
                : "New seller listings appear here after advisor review and publish."
            }
            action={
              hasActiveQuery ? (
                <SmoothButton asChild variant="candy" size="sm">
                  <Link href="/marketplace">Clear filters</Link>
                </SmoothButton>
              ) : (
                <SmoothButton asChild variant="candy" size="sm">
                  <Link href="/sell/new">List a business</Link>
                </SmoothButton>
              )
            }
          />
        ) : (
          <ListingCardGrid listings={listings} />
        )}

        <p className="mt-12 text-center text-[1.05rem] leading-[1.75] text-muted-foreground">
          Looking to sell?{" "}
          <Link href="/sell/new" className="font-semibold text-tz-blue-deep hover:underline">
            List a business confidentially
          </Link>
        </p>
      </section>
    </main>
  );
}
