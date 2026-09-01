"use client";

import Link from "next/link";
import { Landmark, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SmoothButton from "@/components/smoothui/smooth-button";
import { EmptyState } from "@/components/ui/empty-state";
import { DashboardEmpty, DashboardPanel, DashboardRow } from "@/components/console/dashboard-panel";
import { sectorLabel } from "@/types/project-bank";

export type OwnerListing = {
  id: string;
  hashId: string;
  industry: string;
  status: string;
  asking: string;
  createdAt: string;
};

export type OwnerProject = {
  id: string;
  slug: string;
  title: string;
  sector: string;
  broadRegion: string;
  status: string;
  createdAt: string;
  reviewNotes?: string | null;
};

function pretty(value: string) {
  return value.replace(/_/g, " ");
}

function decision(status: string): { label: string; variant: "success" | "warning" | "danger" | "default" } {
  if (status === "PUBLISHED") return { label: "Approved", variant: "success" };
  if (status === "WITHDRAWN" || status === "ARCHIVED" || status === "REJECTED") {
    return { label: "Rejected", variant: "danger" };
  }
  if (status === "PENDING_REVIEW" || status === "DRAFT") return { label: "Under review", variant: "warning" };
  return { label: pretty(status), variant: "default" };
}

export function DashboardOwnerHome({
  role,
  listings,
  projects,
}: {
  role: string;
  listings: OwnerListing[];
  projects: OwnerProject[];
}) {
  if (role === "BUYER") {
    return (
      <EmptyState
        compact
        icon={Store}
        title="Browse businesses for sale"
        description="Anonymized M&A listings. Sign an NDA when you want a data room."
        action={
          <SmoothButton asChild variant="candy" size="sm">
            <Link href="/marketplace">Open marketplace</Link>
          </SmoothButton>
        }
      />
    );
  }

  if (role === "INVESTOR") {
    return (
      <EmptyState
        compact
        icon={Landmark}
        title="Discover project teasers"
        description="Review Project Bank ideas the desk has published for investors."
        action={
          <SmoothButton asChild variant="candy" size="sm">
            <Link href="/project-bank/discover">Open Project Bank</Link>
          </SmoothButton>
        }
      />
    );
  }

  const showListings = listings.length > 0 || role === "SELLER";
  const showProjects = projects.length > 0 || role === "ENTREPRENEUR";

  return (
    <div className="space-y-4">
      {showListings ? (
        <DashboardPanel
          id="my-listings"
          title="My listings"
          description={listings.length ? `${listings.length} submitted` : "Nothing submitted yet"}
          action={
            role === "SELLER" ? (
              <SmoothButton asChild variant="outline" size="sm">
                <Link href="/sell/new">New listing</Link>
              </SmoothButton>
            ) : undefined
          }
        >
          {listings.length === 0 ? (
            <DashboardEmpty>List a business to track review status here.</DashboardEmpty>
          ) : (
            <div className="divide-y divide-border-subtle">
              {listings.map((listing) => {
                const d = decision(listing.status);
                return (
                  <DashboardRow
                    key={listing.id}
                    href={`/marketplace/${listing.hashId}`}
                    title={`${listing.asking} · ${pretty(listing.industry)}`}
                    meta={`${listing.hashId} · ${listing.createdAt}`}
                    badge={<Badge variant={d.variant}>{d.label}</Badge>}
                  />
                );
              })}
            </div>
          )}
        </DashboardPanel>
      ) : null}

      {showProjects ? (
        <DashboardPanel
          id="my-projects"
          title="Project ideas"
          description={projects.length ? `${projects.length} in deal flow` : "Nothing submitted yet"}
          action={
            role === "ENTREPRENEUR" ? (
              <SmoothButton asChild variant="outline" size="sm">
                <Link href="/project-bank/new">List your idea</Link>
              </SmoothButton>
            ) : undefined
          }
        >
          {projects.length === 0 ? (
            <DashboardEmpty>List a teaser to track review status here.</DashboardEmpty>
          ) : (
            <div className="divide-y divide-border-subtle">
              {projects.map((project) => {
                const d = decision(project.status);
                return (
                  <div key={project.id}>
                    <DashboardRow
                      href={`/project-bank/${project.slug}`}
                      title={project.title}
                      meta={`${sectorLabel(project.sector)} · ${project.broadRegion} · ${project.createdAt}`}
                      badge={<Badge variant={d.variant}>{d.label}</Badge>}
                    />
                    {project.reviewNotes ? (
                      <p className="mx-4 mb-3 rounded-lg border border-border bg-warning-bg px-3 py-2 text-sm leading-relaxed text-warning-fg">
                        <span className="font-semibold">Desk suggestion: </span>
                        {project.reviewNotes}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </DashboardPanel>
      ) : null}
    </div>
  );
}
