"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import SmoothButton from "@/components/smoothui/smooth-button";
import { DashboardEmpty, DashboardPanel, DashboardRow } from "@/components/console/dashboard-panel";
import { canEditOwnListing } from "@/lib/listing-status";
import { INDUSTRY_LABELS } from "@/types/listing";

export type SellerListingCard = {
  id: string;
  hashId: string;
  industry: string;
  status: string;
  asking: string;
  createdAt: string;
  reviewNotes: string | null;
};

function decision(status: string): { label: string; variant: "success" | "warning" | "danger" | "default" } {
  if (status === "PUBLISHED") return { label: "Approved", variant: "success" };
  if (status === "WITHDRAWN") return { label: "Rejected", variant: "danger" };
  if (status === "PENDING_REVIEW" || status === "DRAFT") return { label: "Under review", variant: "warning" };
  return { label: status.replace(/_/g, " "), variant: "default" };
}

export function SellerDashboard({ listings }: { listings: SellerListingCard[] }) {
  return (
    <DashboardPanel
      id="my-listings"
      title="My listings"
      description={listings.length ? `${listings.length} submitted` : "Nothing submitted yet"}
      action={
        <SmoothButton asChild variant="outline" size="sm">
          <Link href="/sell/new">New listing</Link>
        </SmoothButton>
      }
    >
      {listings.length === 0 ? (
        <DashboardEmpty>List a business to track review status here.</DashboardEmpty>
      ) : (
        <div className="divide-y divide-border-subtle">
          {listings.map((listing) => {
            const d = decision(listing.status);
            const industry =
              listing.industry in INDUSTRY_LABELS
                ? INDUSTRY_LABELS[listing.industry as keyof typeof INDUSTRY_LABELS]
                : listing.industry.replace(/_/g, " ");
            const editable = canEditOwnListing(listing.status);

            return (
              <div key={listing.id}>
                <DashboardRow
                  href={`/marketplace/${listing.hashId}`}
                  title={`${listing.asking} · ${industry}`}
                  meta={`${listing.hashId} · ${listing.createdAt}`}
                  badge={<Badge variant={d.variant}>{d.label}</Badge>}
                />
                {listing.reviewNotes ? (
                  <p className="mx-4 mb-3 rounded-lg border border-border bg-warning-bg px-3 py-2 text-sm leading-relaxed text-warning-fg">
                    <span className="font-semibold">Desk suggestion: </span>
                    {listing.reviewNotes}
                  </p>
                ) : null}
                {editable ? (
                  <div className="px-4 pb-3">
                    <SmoothButton asChild variant="outline" size="sm">
                      <Link href={`/sell/${listing.id}/edit`}>Edit listing</Link>
                    </SmoothButton>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </DashboardPanel>
  );
}
