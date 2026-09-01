import { notFound } from "next/navigation";
import { PageHeader } from "@/components/console/page-header";
import { UnlockFlow } from "@/components/marketplace/unlock-flow";
import { prisma } from "@/lib/prisma";

export default async function UnlockPage({ params }: { params: Promise<{ hashId: string }> }) {
  const { hashId } = await params;
  const listing = await prisma.listing.findUnique({ where: { hashId } });
  if (!listing || listing.status !== "PUBLISHED") notFound();

  return (
    <main className="flex-1 bg-background">
      <PageHeader
        compact
        eyebrow="NDA Gatekeeper"
        title="Request deep scrutiny"
        description={`Execute a binding NDA for ${hashId}, then select SARA advisory services to unlock the due-diligence data room.`}
      />
      <div className="container-page mx-auto max-w-2xl py-8 sm:py-10">
        <UnlockFlow listingId={listing.id} hashId={listing.hashId} />
      </div>
    </main>
  );
}
