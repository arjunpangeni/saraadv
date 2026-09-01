import { PageHeader } from "@/components/console/page-header";
import { ListingWizard } from "@/components/wizard/listing-wizard";
import { requirePermission } from "@/lib/guard";

export default async function NewListingPage() {
  await requirePermission("listing:create", "/sell/new");
  return (
    <>
      <main className="flex-1 bg-background">
        <PageHeader
          compact
          eyebrow="Marketplace"
          title="List a business"
          description="Buyers see a hash ID. The legal name and books stay with the desk."
        />
        <div className="container-console pt-12 pb-8 sm:pt-16 sm:pb-10">
          <ListingWizard />
        </div>
      </main>
    </>
  );
}
