"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import SmoothButton from "@/components/smoothui/smooth-button";
import { DashboardEmpty, DashboardPanel, DashboardRow } from "@/components/console/dashboard-panel";
import { industryLabel } from "@/types/listing";

export type BuyerInterestCard = {
  listingId: string;
  hashId: string;
  industry: string;
  ndaSignedAt: string | null;
  requestedAt: string;
};

export function BuyerDashboard({ interests }: { interests: BuyerInterestCard[] }) {
  return (
    <DashboardPanel
      id="my-requests"
      title="My requests"
      description={interests.length ? `${interests.length} listing${interests.length === 1 ? "" : "s"}` : "Nothing requested yet"}
      action={
        <SmoothButton asChild variant="outline" size="sm">
          <Link href="/marketplace">Browse</Link>
        </SmoothButton>
      }
    >
      {interests.length === 0 ? (
        <DashboardEmpty>Open a listing teaser and request a full profile to track NDAs here.</DashboardEmpty>
      ) : (
        <div className="divide-y divide-border-subtle">
          {interests.map((item) => (
            <DashboardRow
              key={item.listingId}
              href={`/marketplace/${item.hashId}`}
              title={`${item.hashId} · ${industryLabel(item.industry)}`}
              meta={item.ndaSignedAt ? `NDA signed ${item.ndaSignedAt}` : `Requested ${item.requestedAt}`}
              badge={
                <Badge variant={item.ndaSignedAt ? "success" : "warning"}>
                  {item.ndaSignedAt ? "NDA signed" : "Requested"}
                </Badge>
              }
            />
          ))}
        </div>
      )}
    </DashboardPanel>
  );
}
