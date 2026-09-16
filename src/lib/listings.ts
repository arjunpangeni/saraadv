import { prisma } from "@/lib/prisma";
import { generateUniqueHashId } from "@/lib/hash-id";
import {
  computeAnnualFinancials,
  dealValueBand,
  formatNpr,
  utilizationPct,
  type AnnualLineItems,
  type DealValueBand,
  LINE_ITEM_KEYS,
  EMPTY_LINE_ITEMS,
} from "@/lib/calc";
import { compactDetails } from "@/lib/mail";
import { buildListingSearchContent, upsertListingEmbedding, searchListingIds } from "@/lib/ai-search";
import { notifyRoles } from "@/lib/notifications";
import { deleteStorageKeys } from "@/lib/storage";
import type { ListingWizardInput } from "@/types/listing";
import { INDUSTRY_LABELS, INDUSTRY_OPTIONS } from "@/types/listing";
import type { Role } from "@/generated/prisma";
import { canEditOwnListing } from "@/lib/listing-status";

function industriesMatchingQuery(query: string): Array<(typeof INDUSTRY_OPTIONS)[number]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return INDUSTRY_OPTIONS.filter((sector) => {
    const label = INDUSTRY_LABELS[sector].toLowerCase();
    return sector.toLowerCase().includes(q) || label.includes(q) || q.includes(label);
  });
}

function lineItemsFrom(row: AnnualLineItems): AnnualLineItems {
  const out = { ...EMPTY_LINE_ITEMS };
  for (const k of LINE_ITEM_KEYS) {
    out[k] = Number(row[k] ?? 0);
  }
  return out;
}

export function financialCreateData(
  row: AnnualLineItems & {
    fiscalYear: number;
    fiscalYearLabel: string;
    revenueGrowthPct?: number;
    netMarginPct?: number;
    capex?: number;
  },
  kind: "HISTORICAL" | "FORECAST"
) {
  const items = lineItemsFrom(row);
  const computed = computeAnnualFinancials(items);
  const { balanced: _balanced, ...cached } = computed;
  return {
    kind,
    fiscalYear: row.fiscalYear,
    fiscalYearLabel: row.fiscalYearLabel,
    ...items,
    ...cached,
    revenueGrowthPct: kind === "FORECAST" ? (row.revenueGrowthPct ?? 0) : null,
    netMarginPct: kind === "FORECAST" ? (row.netMarginPct ?? 0) : null,
    capex: kind === "FORECAST" ? (row.capex ?? 0) : null,
  };
}

export async function createListing(ownerId: string, input: ListingWizardInput) {
  const hashId = await generateUniqueHashId("MA", async (candidate) => {
    const existing = await prisma.listing.findUnique({ where: { hashId: candidate } });
    return Boolean(existing);
  });

  let org = await prisma.organization.findFirst({ where: { ownerId } });
  if (org) {
    org = await prisma.organization.update({
      where: { id: org.id },
      data: { name: input.companyName },
    });
  } else {
    org = await prisma.organization.create({
      data: { name: input.companyName, ownerId },
    });
  }

  const listing = await prisma.listing.create({
    data: {
      hashId,
      ownerId,
      organizationId: org.id,
      industry: input.industry,
      legalStructure: input.legalStructure,
      establishedYear: input.establishedYear,
      operatingProvinces: input.operatingProvinces,
      headOffice: input.headOffice,
      plantLocation: input.plantLocation ?? undefined,
      strategicAssumptions: input.strategicAssumptions || undefined,
      status: "PENDING_REVIEW",
      financials: {
        create: [
          ...input.financials.map((f) => financialCreateData(f, "HISTORICAL")),
          ...input.projections.map((f) => financialCreateData(f, "FORECAST")),
        ],
      },
      projections: {
        create: input.projections.map((p) => ({
          year: p.fiscalYear,
          revenueGrowthPct: p.revenueGrowthPct ?? 0,
          netMarginPct: p.netMarginPct ?? 0,
          capex: p.capex ?? 0,
          assumptions: input.strategicAssumptions || undefined,
        })),
      },
      assetRevaluations: { create: input.assetRevaluations },
      complianceRecords: {
        create: input.complianceRecords.map((c) => ({
          authority: c.authority,
          status: c.status,
          identifier: c.identifier,
          lastClearanceYear: c.lastClearanceYear,
          remarks: c.remarks,
          outstandingDisputes: c.outstandingDisputes,
        })),
      },
      ipAssets: { create: input.ipAssets },
      dealTerms: {
        create: {
          askingPriceNpr: input.askingPriceNpr,
          modality: input.modality,
          exitReason: input.exitReason,
          valuationJustification: input.valuationJustification,
        },
      },
      humanCapital: { create: input.humanCapital },
      riskLog: { create: input.riskLog },
      capacityMetrics: input.capacityMetric
        ? {
            create: {
              runningOutput: input.capacityMetric.runningOutput,
              installedPeak: input.capacityMetric.installedPeak,
              capacityUnit: input.capacityMetric.capacityUnit ?? "",
              utilizationPct: utilizationPct(
                input.capacityMetric.runningOutput,
                input.capacityMetric.installedPeak
              ),
            },
          }
        : undefined,
      documents: input.documentKeys?.length
        ? {
            create: input.documentKeys.map((d) => ({
              type: d.type,
              s3Key: d.key,
              isIdentifying: true,
            })),
          }
        : undefined,
    },
    include: { financials: true },
  });

  await prisma.listingDraft.deleteMany({ where: { ownerId } }).catch(() => {});

  const content = buildListingSearchContent(listing);
  await upsertListingEmbedding(listing.id, content).catch((err) =>
    console.error("[listings] failed to index listing for search", err)
  );

  await prisma.auditLog.create({
    data: { actorId: ownerId, action: "listing.create", entity: "Listing", entityId: listing.id },
  });

  await prisma.crmTicket.create({
    data: {
      listingId: listing.id,
      source: "listing_review",
      priority: "HIGH",
      status: "NEW",
      notes: `New anonymized listing ${listing.hashId} submitted for advisor review.`,
    },
  });

  await notifyRoles(["ADMIN", "ADVISOR"], {
    type: "listing.pending_review",
    title: `New listing ${listing.hashId} awaiting review`,
    body: `${listing.industry.replace(/_/g, " ")} · Est. ${listing.establishedYear}`,
    href: "/advisor/listings",
    details: compactDetails({
      Reference: listing.hashId,
      Company: input.companyName,
      Sector: listing.industry.replace(/_/g, " "),
      "Legal structure": input.legalStructure.replace(/_/g, " "),
      Established: listing.establishedYear,
      "Asking price": formatNpr(input.askingPriceNpr),
      Modality: input.modality.replace(/_/g, " "),
      District: input.headOffice?.district,
      Provinces: input.operatingProvinces.join(", "),
    }),
  }).catch((err) => console.error("[listings] failed to notify advisors", err));

  return listing;
}

export async function updateListing(
  ownerId: string,
  listingId: string,
  input: ListingWizardInput,
  opts?: { asAdvisor?: boolean; actorId?: string }
) {
  const existing = await prisma.listing.findFirst({
    where: opts?.asAdvisor ? { id: listingId } : { id: listingId, ownerId },
    include: { organization: true },
  });
  if (!existing) {
    throw new Error("NOT_FOUND");
  }
  if (!opts?.asAdvisor && !canEditOwnListing(existing.status)) {
    throw new Error("LOCKED");
  }

  if (existing.organizationId) {
    await prisma.organization.update({
      where: { id: existing.organizationId },
      data: { name: input.companyName },
    });
  }

  const previousDocumentKeys = (
    await prisma.document.findMany({
      where: { listingId },
      select: { s3Key: true },
    })
  ).map((doc) => doc.s3Key);
  const nextDocumentKeys = new Set(input.documentKeys?.map((doc) => doc.key) ?? []);
  const removedDocumentKeys = previousDocumentKeys.filter((key) => !nextDocumentKeys.has(key));

  const listing = await prisma.$transaction(async (tx) => {
    await tx.financialsAnnual.deleteMany({ where: { listingId } });
    await tx.projection.deleteMany({ where: { listingId } });
    await tx.assetRevaluation.deleteMany({ where: { listingId } });
    await tx.complianceRecord.deleteMany({ where: { listingId } });
    await tx.ipAsset.deleteMany({ where: { listingId } });
    await tx.dealTerms.deleteMany({ where: { listingId } });
    await tx.humanCapital.deleteMany({ where: { listingId } });
    await tx.riskLog.deleteMany({ where: { listingId } });
    await tx.capacityMetric.deleteMany({ where: { listingId } });
    await tx.document.deleteMany({ where: { listingId } });

    return tx.listing.update({
      where: { id: listingId },
      data: {
        industry: input.industry,
        legalStructure: input.legalStructure,
        establishedYear: input.establishedYear,
        operatingProvinces: input.operatingProvinces,
        headOffice: input.headOffice,
        plantLocation: input.plantLocation ?? undefined,
        strategicAssumptions: input.strategicAssumptions || undefined,
        status: opts?.asAdvisor ? existing.status : "PENDING_REVIEW",
        reviewNotes: opts?.asAdvisor ? existing.reviewNotes : null,
        financials: {
          create: [
            ...input.financials.map((f) => financialCreateData(f, "HISTORICAL")),
            ...input.projections.map((f) => financialCreateData(f, "FORECAST")),
          ],
        },
        projections: {
          create: input.projections.map((p) => ({
            year: p.fiscalYear,
            revenueGrowthPct: p.revenueGrowthPct ?? 0,
            netMarginPct: p.netMarginPct ?? 0,
            capex: p.capex ?? 0,
            assumptions: input.strategicAssumptions || undefined,
          })),
        },
        assetRevaluations: { create: input.assetRevaluations },
        complianceRecords: {
          create: input.complianceRecords.map((c) => ({
            authority: c.authority,
            status: c.status,
            identifier: c.identifier,
            lastClearanceYear: c.lastClearanceYear,
            remarks: c.remarks,
            outstandingDisputes: c.outstandingDisputes,
          })),
        },
        ipAssets: { create: input.ipAssets },
        dealTerms: {
          create: {
            askingPriceNpr: input.askingPriceNpr,
            modality: input.modality,
            exitReason: input.exitReason,
            valuationJustification: input.valuationJustification,
          },
        },
        humanCapital: { create: input.humanCapital },
        riskLog: { create: input.riskLog },
        capacityMetrics: input.capacityMetric
          ? {
              create: {
                runningOutput: input.capacityMetric.runningOutput,
                installedPeak: input.capacityMetric.installedPeak,
                capacityUnit: input.capacityMetric.capacityUnit ?? "",
                utilizationPct: utilizationPct(
                  input.capacityMetric.runningOutput,
                  input.capacityMetric.installedPeak
                ),
              },
            }
          : undefined,
        documents: input.documentKeys?.length
          ? {
              create: input.documentKeys.map((d) => ({
                type: d.type,
                s3Key: d.key,
                isIdentifying: true,
              })),
            }
          : undefined,
      },
      include: { financials: true },
    });
  });

  await deleteStorageKeys(removedDocumentKeys, "[listings]");

  const content = buildListingSearchContent(listing);
  await upsertListingEmbedding(listing.id, content).catch((err) =>
    console.error("[listings] failed to index listing for search", err)
  );

  const actorId = opts?.actorId ?? ownerId;
  await prisma.auditLog.create({
    data: {
      actorId,
      action: opts?.asAdvisor ? "listing.advisor_update" : "listing.update",
      entity: "Listing",
      entityId: listing.id,
    },
  });

  if (!opts?.asAdvisor) {
    await prisma.crmTicket.updateMany({
      where: { listingId, source: "listing_review" },
      data: {
        status: "NEW",
        notes: `Listing ${listing.hashId} was edited and resubmitted for review.`,
      },
    });

    await notifyRoles(["ADMIN", "ADVISOR"], {
      type: "listing.pending_review",
      title: `Listing ${listing.hashId} resubmitted for review`,
      body: `${listing.industry.replace(/_/g, " ")} · Est. ${listing.establishedYear}`,
      href: "/advisor/listings",
      details: compactDetails({
        Reference: listing.hashId,
        Company: input.companyName,
        Sector: listing.industry.replace(/_/g, " "),
        "Asking price": formatNpr(input.askingPriceNpr),
      }),
    }).catch((err) => console.error("[listings] failed to notify advisors", err));
  }

  return listing;
}

async function collectListingStorageKeys(listingId: string) {
  const [documents, teasers, ndas] = await Promise.all([
    prisma.document.findMany({ where: { listingId }, select: { s3Key: true } }),
    prisma.teaser.findMany({ where: { listingId }, select: { s3Key: true } }),
    prisma.ndaAgreement.findMany({ where: { listingId }, select: { documentS3Key: true } }),
  ]);
  return [
    ...documents.map((doc) => doc.s3Key),
    ...teasers.map((teaser) => teaser.s3Key),
    ...ndas.map((nda) => nda.documentS3Key).filter((key): key is string => Boolean(key)),
  ];
}

export async function deleteListingAsAdvisor(listingId: string, actorId: string) {
  const existing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, hashId: true },
  });
  if (!existing) throw new Error("NOT_FOUND");

  const storageKeys = await collectListingStorageKeys(listingId);

  await prisma.$transaction([
    prisma.crmTicket.deleteMany({ where: { listingId } }),
    prisma.listing.delete({ where: { id: listingId } }),
  ]);

  await deleteStorageKeys(storageKeys, "[listings]");

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "listing.delete",
      entity: "Listing",
      entityId: listingId,
      metadata: { hashId: existing.hashId },
    },
  });

  return existing;
}

export type MarketplaceSort = "newest" | "asking_desc" | "asking_asc";

export function parseMarketplaceSort(raw?: string): MarketplaceSort | undefined {
  if (raw === "newest" || raw === "asking_desc" || raw === "asking_asc") return raw;
  return undefined;
}

export interface MarketplaceFilters {
  industry?: string;
  dealValueBand?: DealValueBand;
  positiveEbitdaOnly?: boolean;
  province?: string;
  district?: string;
  minRevenueNpr?: number;
  query?: string;
  sort?: MarketplaceSort;
}

export interface PublicListingSummary {
  id: string;
  hashId: string;
  industry: string;
  legalStructure: string;
  establishedYear: number;
  district: string | null;
  province: string | null;
  operatingProvinces: string[];
  askingPriceNpr: number | null;
  dealValueBand: DealValueBand | null;
  modality: string | null;
  latestEbitda: number | null;
  latestRevenue: number | null;
  totalAssets: number | null;
  largestTurnover: number | null;
  licensedCapacity: string | null;
  status: string;
  createdAt: Date;
}

export async function getPublicListings(filters: MarketplaceFilters): Promise<PublicListingSummary[]> {
  let rankedIds: string[] | null = null;
  const query = filters.query?.trim();

  if (query) {
    try {
      const ranked = await searchListingIds(query, 200);
      rankedIds = ranked.map((r) => r.listingId);
    } catch (err) {
      console.error("[listings] searchListingIds failed, using field fallback", err);
      rankedIds = null;
    }
  }

  const matchedIndustries = query ? industriesMatchingQuery(query) : [];
  const useFieldFallback = Boolean(query) && (!rankedIds || rankedIds.length === 0);

  const listings = await prisma.listing.findMany({
    where: {
      status: "PUBLISHED",
      ...(filters.industry ? { industry: filters.industry as never } : {}),
      ...(rankedIds && rankedIds.length > 0 ? { id: { in: rankedIds } } : {}),
      ...(useFieldFallback
        ? {
            OR: [
              { hashId: { contains: query!, mode: "insensitive" } },
              ...(matchedIndustries.length > 0
                ? [{ industry: { in: matchedIndustries as never } }]
                : []),
            ],
          }
        : {}),
    },
    include: {
      financials: {
        where: {
          OR: [{ kind: "HISTORICAL", fiscalYear: 1 }, { kind: "FORECAST" }],
        },
      },
      dealTerms: true,
      capacityMetrics: true,
    },
    take: 200,
  });

  // Preserve embedding rank order when available
  if (rankedIds && rankedIds.length > 0) {
    const order = new Map(rankedIds.map((id, i) => [id, i]));
    listings.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
  }

  let summaries: PublicListingSummary[] = listings.map((l) => {
    const headOffice = l.headOffice as { district?: string; province?: string } | null;
    const latest = l.financials.find((f) => f.kind === "HISTORICAL" && f.fiscalYear === 1);
    const largestTurnover = l.financials
      .filter((f) => f.kind === "FORECAST")
      .reduce((max, y) => Math.max(max, Number(y.grossRevenue)), 0);
    const asking = l.dealTerms ? Number(l.dealTerms.askingPriceNpr) : null;
    const provinces = l.operatingProvinces.length
      ? l.operatingProvinces
      : headOffice?.province
        ? [headOffice.province]
        : [];
    const unit = l.capacityMetrics?.capacityUnit;
    const peak = l.capacityMetrics ? Number(l.capacityMetrics.installedPeak) : null;
    return {
      id: l.id,
      hashId: l.hashId,
      industry: l.industry,
      legalStructure: l.legalStructure,
      establishedYear: l.establishedYear,
      district: headOffice?.district ?? null,
      province: provinces[0] ?? headOffice?.province ?? null,
      operatingProvinces: provinces,
      askingPriceNpr: asking,
      dealValueBand: asking !== null ? dealValueBand(asking) : null,
      modality: l.dealTerms?.modality ?? null,
      latestEbitda: latest ? Number(latest.ebitda) : null,
      latestRevenue: latest ? Number(latest.grossRevenue) : null,
      totalAssets: latest ? Number(latest.totalAssets) : null,
      largestTurnover: largestTurnover > 0 ? largestTurnover : null,
      licensedCapacity:
        peak && peak > 0
          ? `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(peak)}${unit ? ` ${unit}` : ""}`
          : null,
      status: l.status,
      createdAt: l.createdAt,
    };
  });

  if (filters.dealValueBand) {
    summaries = summaries.filter((s) => s.dealValueBand === filters.dealValueBand);
  }
  if (filters.positiveEbitdaOnly) {
    summaries = summaries.filter((s) => (s.latestEbitda ?? 0) > 0);
  }
  if (filters.province) {
    const p = filters.province.toLowerCase();
    summaries = summaries.filter(
      (s) =>
        s.operatingProvinces.some((op) => op.toLowerCase() === p) ||
        s.province?.toLowerCase() === p
    );
  }
  if (filters.district) {
    summaries = summaries.filter((s) =>
      s.district?.toLowerCase().includes(filters.district!.toLowerCase())
    );
  }
  if (filters.minRevenueNpr) {
    summaries = summaries.filter((s) => (s.latestRevenue ?? 0) >= filters.minRevenueNpr!);
  }

  if (filters.sort === "asking_desc") {
    summaries.sort((a, b) => (b.askingPriceNpr ?? -1) - (a.askingPriceNpr ?? -1));
  } else if (filters.sort === "asking_asc") {
    summaries.sort((a, b) => (a.askingPriceNpr ?? Number.POSITIVE_INFINITY) - (b.askingPriceNpr ?? Number.POSITIVE_INFINITY));
  } else if (filters.sort === "newest" || !rankedIds) {
    summaries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } else {
    const order = new Map(rankedIds.map((id, i) => [id, i]));
    summaries.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
  }

  return summaries;
}

export async function hasNdaAccess(userId: string | undefined, listingId: string): Promise<boolean> {
  if (!userId) return false;
  const nda = await prisma.ndaAgreement.findUnique({
    where: { buyerId_listingId: { buyerId: userId, listingId } },
  });
  return Boolean(nda);
}

export function canViewFullListing(
  role: Role | undefined,
  isOwner: boolean,
  hasNda: boolean,
  verified = false
): boolean {
  if (role === "ADMIN" || role === "ADVISOR") return true;
  if (isOwner) return true;
  return hasNda && verified;
}

/** Staff and owners can open unpublished listing pages for preview. */
export function canPreviewUnpublishedListing(
  role: Role | undefined,
  isOwner: boolean
): boolean {
  if (isOwner) return true;
  return role === "ADMIN" || role === "ADVISOR";
}

export async function logDataRoomAccess(actorId: string, listingId: string, action: string) {
  await prisma.auditLog.create({
    data: { actorId, action, entity: "Listing", entityId: listingId },
  });
}
