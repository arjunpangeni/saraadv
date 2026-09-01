import { ListingCard } from "@/components/marketplace/listing-card";
import type { PublicListingSummary } from "@/lib/listings";

export function ListingCardGrid({ listings }: { listings: PublicListingSummary[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing, i) => (
        <ListingCard key={listing.id} listing={listing} priority={i < 3} />
      ))}
    </div>
  );
}
