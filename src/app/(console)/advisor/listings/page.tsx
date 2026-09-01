import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma";
import { ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/console/page-header";
import { FilterTabs } from "@/components/console/filter-tabs";
import { ListingReviewActions } from "@/components/advisor/listing-review-actions";
import { ListingRequestCard } from "@/components/advisor/listing-request-card";
import { ListingsSearchForm } from "@/components/advisor/listings-search-form";
import {
  listingDeskHref,
  listingDeskStatus,
  parseListingDeskFilter,
} from "@/components/advisor/listings-desk";
import { PagePagination } from "@/components/console/page-pagination";
import { prisma } from "@/lib/prisma";
import { formatNpr } from "@/lib/calc";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { PAGE_SIZE, pageCount, pageSkip, parsePage } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Sale requests",
};

function searchWhere(q: string): Prisma.ListingWhereInput {
  const query = q.trim();
  if (!query) return {};
  return {
    OR: [
      { hashId: { contains: query, mode: "insensitive" } },
      { organization: { name: { contains: query, mode: "insensitive" } } },
      { owner: { name: { contains: query, mode: "insensitive" } } },
      { owner: { email: { contains: query, mode: "insensitive" } } },
    ],
  };
}

export default async function AdvisorListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>;
}) {
  const { status: statusParam, page: pageParam, q: qParam } = await searchParams;
  const filter = parseListingDeskFilter(statusParam);
  const page = parsePage(pageParam);
  const q = qParam?.trim() ?? "";
  const query = searchWhere(q);
  const listingStatus = listingDeskStatus(filter);
  const where = { status: listingStatus, ...query };

  const [listings, total, pendingCount, liveCount, rejectedCount] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { organization: true, dealTerms: true, owner: { select: { id: true, name: true, email: true } } },
      skip: pageSkip(page),
      take: PAGE_SIZE,
    }),
    prisma.listing.count({ where }),
    prisma.listing.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.listing.count({ where: { status: "PUBLISHED" } }),
    prisma.listing.count({ where: { status: "WITHDRAWN" } }),
  ]);

  return (
    <main className="flex-1 bg-background">
      <PageHeader
        compact
        title="Sale requests"
        description={
          pendingCount > 0
            ? `${pendingCount} business${pendingCount === 1 ? "" : "es"} waiting for approval before going live on the marketplace.`
            : "Seller sale requests appear here after they submit a business for sale."
        }
      />
      <div className="container-console py-4 sm:py-5">
        <FilterTabs
          className="mb-5"
          items={[
            {
              href: listingDeskHref({ status: "pending", q }),
              label: `Pending (${pendingCount})`,
              active: filter === "pending",
            },
            {
              href: listingDeskHref({ status: "live", q }),
              label: `Live (${liveCount})`,
              active: filter === "live",
            },
            {
              href: listingDeskHref({ status: "rejected", q }),
              label: `Rejected (${rejectedCount})`,
              active: filter === "rejected",
            },
          ]}
        />
        <div className="mb-5">
          <ListingsSearchForm status={filter} q={q} />
        </div>

        {listings.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={
              q
                ? "No matching sale requests"
                : filter === "live"
                  ? "No live sale requests"
                  : filter === "rejected"
                    ? "No rejected sale requests"
                    : "No sale requests pending review"
            }
            description={
              q
                ? `Nothing matches “${q}” in this view.`
                : filter === "pending"
                  ? "Seller submissions appear here after they list a business for sale."
                  : "Switch filters to see other sale requests."
            }
          />
        ) : (
          <div className="space-y-4">
            {listings.map((l) => {
              const headOffice = l.headOffice as { district?: string; province?: string } | null;
              return (
                <ListingRequestCard
                  key={l.id}
                  hashId={l.hashId}
                  companyName={l.organization?.name}
                  industry={l.industry}
                  asking={l.dealTerms ? formatNpr(Number(l.dealTerms.askingPriceNpr)) : "On request"}
                  modality={l.dealTerms?.modality}
                  district={headOffice?.district ?? null}
                  provinces={l.operatingProvinces}
                  sellerName={l.owner.name || l.owner.email}
                  sellerEmail={l.owner.email}
                  status={l.status}
                  submittedAt={formatRelativeTime(l.createdAt)}
                  submittedTitle={l.createdAt.toLocaleString()}
                  actions={
                    <ListingReviewActions
                      listingId={l.id}
                      hashId={l.hashId}
                      status={l.status}
                      companyName={l.organization?.name}
                    />
                  }
                />
              );
            })}
          </div>
        )}
        {total > 0 ? (
          <div className="mt-6 space-y-3">
            <p className="text-center text-sm text-foreground/70">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <PagePagination page={page} totalPages={pageCount(total)} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
