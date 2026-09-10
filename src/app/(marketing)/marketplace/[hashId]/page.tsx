import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Calendar, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  hasNdaAccess,
  canViewFullListing,
  canPreviewUnpublishedListing,
  logDataRoomAccess,
} from "@/lib/listings";
import { formatCapacity, formatNpr, LINE_ITEM_KEYS, EMPTY_LINE_ITEMS, type AnnualLineItems } from "@/lib/calc";
import { displayYearOrder } from "@/lib/fiscal-years";
import {
  industryLabel,
  legalStructureLabel,
  modalityLabel,
  exitReasonLabel,
} from "@/types/listing";
import { ViewTracker, TeaserDownloadButton } from "@/components/marketplace/listing-actions";
import { ListingLeadModal, ListingLeadReceived } from "@/components/marketplace/listing-lead-modal";
import { getListingLeadContext } from "@/lib/listing-lead-session";
import { ListingDataRoom } from "@/components/marketplace/listing-data-room";
import { toMatrixYear } from "@/lib/financial-matrix";
import { BuyerTeaserList, ListingMetricGrid } from "@/components/marketplace/buyer-teaser";
import { GatedListingPreview } from "@/components/marketplace/gated-listing-preview";
import { PageBreadcrumbs } from "@/components/marketing/page-breadcrumbs";
import { pageMetadata } from "@/lib/seo";
import { isDeskRole } from "@/lib/rbac";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hashId: string }>;
}): Promise<Metadata> {
  const { hashId } = await params;
  const listing = await prisma.listing.findUnique({
    where: { hashId },
    select: { status: true },
  });
  const published = listing?.status === "PUBLISHED";
  return {
    ...pageMetadata({
      title: `${hashId} - Anonymized Business Opportunity`,
      description: `Confidential M&A opportunity ${hashId} listed via ASAR Partners. Sign an NDA to access full financials and due-diligence data.`,
      path: `/marketplace/${hashId}`,
      ogTitle: `${hashId} | Anonymized business opportunity in Nepal`,
    }),
    robots: published ? { index: true, follow: true } : { index: false, follow: false },
  };
}

function lineItemsFrom(row: Record<string, unknown>): AnnualLineItems {
  const out = { ...EMPTY_LINE_ITEMS };
  for (const k of LINE_ITEM_KEYS) {
    out[k] = Number(row[k] ?? 0);
  }
  return out;
}

function placeLabel(value: unknown) {
  const loc = value as { district?: string; province?: string; localBody?: string; ward?: string } | null;
  if (!loc) return null;
  return [loc.localBody, loc.district, loc.province].filter(Boolean).join(", ") || null;
}

async function getListing(hashId: string) {
  return prisma.listing.findUnique({
    where: { hashId },
    include: {
      financials: { orderBy: [{ kind: "asc" }, { fiscalYear: "asc" }] },
      projections: { orderBy: { year: "asc" } },
      assetRevaluations: true,
      complianceRecords: true,
      ipAssets: true,
      dealTerms: true,
      humanCapital: true,
      riskLog: true,
      capacityMetrics: true,
    },
  });
}

export default async function ListingDetailPage({ params }: { params: Promise<{ hashId: string }> }) {
  const { hashId } = await params;
  const listing = await getListing(hashId);
  if (!listing) notFound();

  const session = await auth();
  const isOwner = session?.user?.id === listing.ownerId;
  const isPublished = listing.status === "PUBLISHED";

  if (!isPublished && !canPreviewUnpublishedListing(session?.user?.role, isOwner)) {
    notFound();
  }

  const [hasNda, leadContext] = await Promise.all([
    hasNdaAccess(session?.user?.id, listing.id),
    getListingLeadContext(listing.id),
  ]);
  const canViewFull = canViewFullListing(
    session?.user?.role,
    isOwner,
    hasNda,
    Boolean(session?.user?.verified)
  );

  if (canViewFull && session?.user) {
    await logDataRoomAccess(session.user.id, listing.id, "listing.dataroom.view");
  }

  const headOffice = listing.headOffice as { district?: string; province?: string; ward?: string } | null;
  const provinces = listing.operatingProvinces.length
    ? listing.operatingProvinces
    : headOffice?.province
      ? [headOffice.province]
      : [];

  const historical = canViewFull
    ? listing.financials
        .filter((f) => f.kind === "HISTORICAL")
        .map((f) => toMatrixYear({ ...lineItemsFrom(f), fiscalYear: f.fiscalYear, fiscalYearLabel: f.fiscalYearLabel }))
    : [];
  const forecast = canViewFull
    ? listing.financials
        .filter((f) => f.kind === "FORECAST")
        .map((f) => toMatrixYear({ ...lineItemsFrom(f), fiscalYear: f.fiscalYear, fiscalYearLabel: f.fiscalYearLabel }))
    : [];

  const latestHistorical = listing.financials.find((f) => f.kind === "HISTORICAL" && f.fiscalYear === 1);
  const largestTurnover = listing.financials
    .filter((f) => f.kind === "FORECAST")
    .reduce((max, y) => Math.max(max, Number(y.grossRevenue)), 0);
  const unit = listing.capacityMetrics?.capacityUnit;
  const peak = listing.capacityMetrics ? Number(listing.capacityMetrics.installedPeak) : 0;
  const licensedCapacity = peak > 0 ? formatCapacity(peak, unit) : "";
  const asking = listing.dealTerms ? formatNpr(Number(listing.dealTerms.askingPriceNpr)) : "On request";
  const balanceSheet = latestHistorical ? formatNpr(Number(latestHistorical.totalAssets)) : "";
  const turnover = largestTurnover > 0 ? formatNpr(largestTurnover) : "";
  const modality = listing.dealTerms ? modalityLabel(listing.dealTerms.modality) : "";
  const place = headOffice?.district ?? "Nepal";
  const location = [place, provinces.length ? provinces.join(", ") : null].filter(Boolean).join(" · ");

  return (
    <>
      <ViewTracker listingId={listing.id} />
      <main className="flex-1">
        <div className="container-page py-16 sm:py-20">
          <PageBreadcrumbs
            items={[
              { name: "Marketplace", href: "/marketplace" },
              { name: listing.hashId },
            ]}
          />
          {!isPublished && (
            <div className="mt-4 rounded-lg border border-border bg-warning-bg px-4 py-2.5 text-sm text-warning-fg">
              Preview only — this listing is {listing.status.replace(/_/g, " ").toLowerCase()} and is not live yet.
            </div>
          )}

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="order-2 min-w-0 lg:order-1">
              <div className="flex flex-wrap items-center gap-2 text-sm text-foreground/60">
                <span className="rounded-md bg-tz-green px-2 py-0.5 text-[11px] font-semibold text-tz-green-deep">
                  {industryLabel(listing.industry)}
                </span>
                {modality ? (
                  <span className="rounded-md bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-foreground/70">
                    {modality}
                  </span>
                ) : null}
                <span>{legalStructureLabel(listing.legalStructure)}</span>
                <span className="text-foreground/25">·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden />
                  {location}
                </span>
                <span className="text-foreground/25">·</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3.5" aria-hidden />
                  Est. {listing.establishedYear}
                </span>
              </div>

              <h1 className="heading-soft mt-3 break-all font-heading font-mono text-[1.7rem] font-semibold tracking-[-0.015em] text-foreground sm:text-[2rem]">
                {listing.hashId}
              </h1>
              <p className="mt-4 max-w-2xl text-pretty text-[1.05rem] leading-[1.75] text-muted-foreground">
                Company identity stays gated until an NDA.
              </p>

              <div className="mt-6">
                <ListingMetricGrid
                  items={[
                    { label: "Asking", value: asking },
                    { label: "Balance sheet", value: balanceSheet },
                    { label: "Capacity", value: licensedCapacity },
                  ]}
                />
              </div>

              <div className="mt-6">
                <BuyerTeaserList
                  rows={[
                    { label: "Modality", value: modality },
                    { label: "Reason for exit", value: exitReasonLabel(listing.dealTerms?.exitReason) },
                    {
                      label: "Sale value note",
                      value: listing.dealTerms?.valuationJustification?.trim() || "",
                    },
                    { label: "3-year turnover", value: turnover },
                  ]}
                />
              </div>
            </div>

            <aside className="order-1 space-y-4 lg:sticky lg:top-24 lg:order-2">
              {canViewFull ? (
                <p className="rounded-2xl border border-success/30 bg-success-bg/40 px-4 py-3 text-sm text-success-fg">
                  Full data room unlocked. Line-item books, revaluations, compliance, and documents are below.
                </p>
              ) : (
                <>
                  <GatedListingPreview />
                  {isPublished ? (
                    leadContext.remembered && leadContext.requested ? (
                      <ListingLeadReceived hashId={listing.hashId} name={leadContext.name} />
                    ) : (
                      <ListingLeadModal
                        compact
                        listingId={listing.id}
                        hashId={listing.hashId}
                        prefill={leadContext.remembered ? leadContext.prefill : undefined}
                      />
                    )
                  ) : null}
                </>
              )}
              {canViewFull && (isPublished || isDeskRole(session?.user?.role)) ? (
                <TeaserDownloadButton listingId={listing.id} />
              ) : null}
            </aside>
          </div>

          {canViewFull ? (
            <div className="mt-10">
              <ListingDataRoom
                listingId={listing.id}
                historical={historical}
                forecast={forecast}
                strategicAssumptions={listing.strategicAssumptions}
                forecastExtras={displayYearOrder(
                  listing.financials
                    .filter((f) => f.kind === "FORECAST")
                    .map((f) => ({
                      fiscalYear: f.fiscalYear,
                      fiscalYearLabel: f.fiscalYearLabel,
                      label: f.fiscalYearLabel || `Year ${f.fiscalYear}`,
                      growthPct: Number(f.revenueGrowthPct ?? 0),
                      marginPct: Number(f.netMarginPct ?? 0),
                      capex: Number(f.capex ?? 0),
                    }))
                ).map(({ label, growthPct, marginPct, capex }) => ({
                  label,
                  growthPct,
                  marginPct,
                  capex,
                }))}
                assetRevaluations={listing.assetRevaluations.map((a) => ({
                  assetType: a.assetType,
                  bookValue: Number(a.bookValue),
                  marketValue: Number(a.marketValue),
                  notes: a.notes,
                }))}
                complianceRecords={listing.complianceRecords.map((c) => ({
                  authority: c.authority,
                  status: c.status,
                  identifier: c.identifier,
                  lastClearanceYear: c.lastClearanceYear,
                  remarks: c.remarks,
                  outstandingDisputes: c.outstandingDisputes,
                }))}
                ipAssets={listing.ipAssets.map((ip) => ({ type: ip.type, reference: ip.reference }))}
                humanCapital={
                  listing.humanCapital
                    ? {
                        managementCount: listing.humanCapital.managementCount,
                        technicalCount: listing.humanCapital.technicalCount,
                        generalCount: listing.humanCapital.generalCount,
                        ssfCompliant: listing.humanCapital.ssfCompliant,
                      }
                    : null
                }
                riskLog={
                  listing.riskLog
                    ? {
                        outstandingDebt: Number(listing.riskLog.outstandingDebt),
                        assetEncumbrances: listing.riskLog.assetEncumbrances,
                        bankCollateralTies: listing.riskLog.bankCollateralTies,
                        pendingLitigations: listing.riskLog.pendingLitigations,
                      }
                    : null
                }
                capacityPct={listing.capacityMetrics ? Number(listing.capacityMetrics.utilizationPct) : null}
                plantLocation={placeLabel(listing.plantLocation)}
              />
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}
