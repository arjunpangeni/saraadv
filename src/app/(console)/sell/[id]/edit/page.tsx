import { notFound } from "next/navigation";
import { PageHeader } from "@/components/console/page-header";
import { ListingWizard } from "@/components/wizard/listing-wizard";
import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { listingToWizardDraft } from "@/lib/listing-form";
import { canEditOwnListing } from "@/lib/listing-status";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("listing:manageOwn", "/dashboard");
  const { id } = await params;

  const listing = await prisma.listing.findFirst({
    where: { id, ownerId: session.user.id },
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

  if (!canEditOwnListing(listing.status)) {
    return (
      <main className="flex-1 bg-background">
        <PageHeader
          compact
          title="This listing cannot be edited"
          description={`${listing.hashId} is ${listing.status.replace(/_/g, " ").toLowerCase()} and is locked.`}
        />
      </main>
    );
  }

  return (
    <main className="flex-1 bg-background">
      <PageHeader
        compact
        eyebrow={listing.hashId}
        title="Edit listing"
        description="Update the details and resubmit. The desk will review it again before it goes live."
      />
      <div className="container-console pt-12 pb-8 sm:pt-16 sm:pb-10">
        <ListingWizard
          edit={{
            id: listing.id,
            hashId: listing.hashId,
            reviewNotes: listing.reviewNotes,
            draft: listingToWizardDraft(listing),
          }}
        />
      </div>
    </main>
  );
}
