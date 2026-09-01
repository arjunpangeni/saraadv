import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTeaserPdf } from "@/lib/pdf/teaser";
import { generateListingDeskPdf } from "@/lib/pdf/listing-desk";
import { logEvent } from "@/lib/analytics";
import { canAccessConfidentialListing, investorVerificationMessage } from "@/lib/investor-access";
import { isDeskRole } from "@/lib/rbac";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required to download investment teasers." }, { status: 401 });
  }

  const desk = isDeskRole(session.user.role);

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      organization: { select: { name: true } },
      owner: { select: { name: true, email: true } },
      financials: true,
      dealTerms: true,
      capacityMetrics: true,
      projections: true,
      assetRevaluations: true,
      complianceRecords: true,
      ipAssets: true,
      humanCapital: true,
      riskLog: true,
      documents: { select: { type: true, s3Key: true } },
    },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (!desk && !listing.dealTerms) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const allowed = await canAccessConfidentialListing(session.user.id, session.user.role, listing.ownerId);
  if (!allowed) {
    return NextResponse.json(
      { error: investorVerificationMessage(session.user.role) },
      { status: 403 }
    );
  }

  const pdfBytes = desk
    ? await generateListingDeskPdf({
        hashId: listing.hashId,
        status: listing.status,
        companyName: listing.organization?.name,
        sellerName: listing.owner.name,
        sellerEmail: listing.owner.email,
        industry: listing.industry,
        legalStructure: listing.legalStructure,
        establishedYear: listing.establishedYear,
        operatingProvinces: listing.operatingProvinces,
        headOffice: listing.headOffice,
        plantLocation: listing.plantLocation,
        strategicAssumptions: listing.strategicAssumptions,
        reviewNotes: listing.reviewNotes,
        dealTerms: listing.dealTerms,
        financials: listing.financials as unknown as Record<string, unknown>[],
        projections: listing.projections,
        assetRevaluations: listing.assetRevaluations,
        complianceRecords: listing.complianceRecords,
        ipAssets: listing.ipAssets,
        humanCapital: listing.humanCapital,
        riskLog: listing.riskLog,
        capacityMetrics: listing.capacityMetrics,
        documents: listing.documents,
      })
    : await generateTeaserPdf({
        hashId: listing.hashId,
        industry: listing.industry.replace(/_/g, " "),
        legalStructure: listing.legalStructure.replace(/_/g, " "),
        establishedYear: listing.establishedYear,
        province: listing.operatingProvinces.length
          ? listing.operatingProvinces.join(", ")
          : ((listing.headOffice as { province?: string } | null)?.province ?? "N/A"),
        district: (listing.headOffice as { district?: string } | null)?.district ?? "N/A",
        askingPriceNpr: Number(listing.dealTerms!.askingPriceNpr),
        modality: listing.dealTerms!.modality.replace(/_/g, " "),
        exitReason: listing.dealTerms!.exitReason.replace(/_/g, " "),
        valuationJustification: listing.dealTerms!.valuationJustification,
        licensedCapacity: listing.capacityMetrics
          ? (() => {
              const peak = Number(listing.capacityMetrics.installedPeak);
              const unit = listing.capacityMetrics.capacityUnit;
              return peak > 0 ? `${peak}${unit ? ` ${unit}` : ""}` : "—";
            })()
          : "—",
        largestTurnoverNpr: listing.financials
          .filter((f) => f.kind === "FORECAST")
          .reduce((max, y) => Math.max(max, Number(y.grossRevenue)), 0),
        balanceSheetSizeNpr: (() => {
          const latest = listing.financials.find((f) => f.kind === "HISTORICAL" && f.fiscalYear === 1);
          return latest ? Number(latest.totalAssets) : 0;
        })(),
        latestFiscalYear: (() => {
          const latest = listing.financials.find((f) => f.kind === "HISTORICAL" && f.fiscalYear === 1);
          return {
            revenue: latest ? Number(latest.grossRevenue) : 0,
            ebitda: latest ? Number(latest.ebitda) : 0,
            npat: latest ? Number(latest.npat) : 0,
          };
        })(),
        utilizationPct: listing.capacityMetrics ? Number(listing.capacityMetrics.utilizationPct) : undefined,
      });

  await logEvent({
    type: desk ? "listing_dossier_downloaded" : "teaser_downloaded",
    sessionId: session.user.id,
    userId: session.user.id,
    entityType: "Listing",
    entityId: id,
  });

  const safeHashId = listing.hashId.replace(/[^a-zA-Z0-9_-]/g, "-");
  const filename = `${desk ? "dossier" : "teaser"}-${safeHashId}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBytes.byteLength),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
