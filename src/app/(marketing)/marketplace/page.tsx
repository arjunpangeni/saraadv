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
    <main className="flex-1 bg-background">
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

      <div className="container-page py-8 sm:py-10">
        <div className="mb-6 min-w-0">
          <p className="text-sm font-medium tracking-tight text-brand-sky">M&A Marketplace</p>
          <h1 className="mt-1 text-pretty font-display text-3xl font-extrabold tracking-tight text-foreground">
            Anonymized opportunities
          </h1>
          <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-foreground/70">
            Company names stay hidden. Request a profile with a work email — SARA arranges an NDA before
            anything confidential is shared.
          </p>
        </div>

        <Suspense fallback={<div className="mb-6 h-28 animate-pulse rounded-2xl border border-border bg-card sm:h-24" />}>
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

        <p className="mt-8 text-center text-sm leading-relaxed text-foreground/70">
          Looking to sell?{" "}
          <Link href="/sell/new" className="font-medium text-brand-sky hover:underline">
            List a business confidentially
          </Link>
        </p>
      </div>
    </main>
  );
}
