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
import { DiscoverPageHeader } from "@/components/marketing/discover-page-header";
import { pageMetadata, itemListJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { LIST_BUSINESS_HREF } from "@/lib/auth-utils";

export const metadata: Metadata = pageMetadata({
  title: "Marketplace - Businesses for Sale in Nepal",
  description:
    "Browse businesses for sale across Nepal. Each listing uses a symbolic name; the real company identity stays private until an NDA. Filter by sector, deal value, and location.",
  path: "/marketplace",
  ogTitle: "Businesses for sale in Nepal | Marketplace",
});

export const revalidate = 60;

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const hasActiveQuery = Boolean(sp.q || sp.industry || sp.dealValueBand || sp.province || sp.sort);

  const listings = await getPublicListings({
    query: sp.q,
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
            name: "Businesses for sale in Nepal",
            description:
              "Advisor-reviewed businesses listed for sale. Cards use symbolic names until an NDA.",
            path: "/marketplace",
            items: listings.map((l) => ({
              name: l.hashId,
              url: `${siteConfig.url}/marketplace/${l.hashId}`,
            })),
          })}
        />
      ) : null}

      <DiscoverPageHeader
        eyebrow="Marketplace"
        title="Businesses for sale"
        description="Each card uses a symbolic name (e.g. ASAR-MA-720). The real company identity stays private until an NDA."
      />

      <section className="container-page pt-5 pb-20 sm:pt-6 sm:pb-28">
        <Suspense fallback={<div className="mb-5 h-10 animate-pulse rounded-full bg-muted/60" />}>
          <MarketplaceFilterBar resultCount={listings.length} />
        </Suspense>

        {listings.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={hasActiveQuery ? "No businesses match your search" : "No businesses listed yet"}
            description={
              hasActiveQuery
                ? "Try a broader search, remove a filter chip, or clear everything and browse again."
                : "New seller listings appear here after advisor review and publish."
            }
            action={
              hasActiveQuery ? (
                <SmoothButton asChild variant="candy" size="sm">
                  <Link href="/marketplace">Clear search</Link>
                </SmoothButton>
              ) : (
                <SmoothButton asChild variant="candy" size="sm">
                  <Link href={LIST_BUSINESS_HREF} prefetch={false}>
                    List a business
                  </Link>
                </SmoothButton>
              )
            }
          />
        ) : (
          <ListingCardGrid listings={listings} />
        )}

        <p className="mt-12 text-center text-[1.05rem] leading-[1.75] text-muted-foreground">
          Looking to sell?{" "}
          <Link href={LIST_BUSINESS_HREF} prefetch={false} className="font-semibold text-tz-blue-deep hover:underline">
            List a business confidentially
          </Link>
        </p>
      </section>
    </main>
  );
}
