import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/console/page-header";
import { ListingWizard } from "@/components/wizard/listing-wizard";
import { requireDesk } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { listingToWizardDraft } from "@/lib/listing-form";
import { listingDeskHref, parseListingDeskFilter } from "@/components/advisor/listings-desk";

export default async function AdvisorEditListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  await requireDesk("/advisor/listings");
  const { id } = await params;
  const { from: fromParam } = await searchParams;
  const backHref = listingDeskHref({ status: parseListingDeskFilter(fromParam) });

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      organization: true,
      financials: true,
      projections: true,
      assetRevaluations: true,
      complianceRecords: true,
      ipAssets: true,
      dealTerms: true,
      humanCapital: true,
      riskLog: true,
      capacityMetrics: true,
      documents: true,
    },
  });

  if (!listing) notFound();

  return (
    <main className="flex-1 bg-background">
      <PageHeader
        compact
        eyebrow="Deal desk"
        title={`Edit ${listing.hashId}`}
        description={`${listing.organization?.name || "Unnamed company"} · ${listing.status.replace(/_/g, " ")}`}
        actions={
          <Link href={backHref} className="text-sm font-medium text-brand-sky hover:underline">
            Back to sale requests
          </Link>
        }
      />
      <div className="container-console pt-12 pb-8 sm:pt-16 sm:pb-10">
        <ListingWizard
          edit={{
            id: listing.id,
            hashId: listing.hashId,
            reviewNotes: listing.reviewNotes,
            draft: listingToWizardDraft(listing),
            desk: true,
          }}
        />
      </div>
    </main>
  );
}
