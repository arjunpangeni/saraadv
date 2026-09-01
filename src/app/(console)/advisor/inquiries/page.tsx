import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma";
import { Inbox } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/console/page-header";
import { PagePagination } from "@/components/console/page-pagination";
import { ServiceInquiryRow } from "@/components/advisor/service-inquiry-row";
import {
  InquiryStatusTabs,
  InquiryTypeTabs,
  parseInquiryStatus,
  parseInquiryType,
} from "@/components/advisor/inquiries-desk";
import { InquiriesSearchForm } from "@/components/advisor/inquiries-search-form";
import { prisma } from "@/lib/prisma";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { PAGE_SIZE, pageCount, pageSkip, parsePage } from "@/lib/pagination";
import { SERVICE_INQUIRY_TAB_LABELS } from "@/lib/service-inquiries";

export const metadata: Metadata = {
  title: "Inquiries",
};

function searchWhere(q: string): Prisma.ServiceInquiryWhereInput {
  const query = q.trim();
  if (!query) return {};
  return {
    OR: [
      { contactName: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      { subject: { contains: query, mode: "insensitive" } },
      { message: { contains: query, mode: "insensitive" } },
    ],
  };
}

export default async function AdvisorInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; q?: string; page?: string }>;
}) {
  const { type: typeParam, status: statusParam, q: qParam, page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const q = qParam?.trim() ?? "";
  const typeFilter = parseInquiryType(typeParam);
  const statusFilter = parseInquiryStatus(statusParam);
  const query = searchWhere(q);

  const listWhere: Prisma.ServiceInquiryWhereInput = {
    ...query,
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  };
  const typeCountWhere: Prisma.ServiceInquiryWhereInput = {
    ...query,
    ...(statusFilter ? { status: statusFilter } : {}),
  };
  const statusCountWhere: Prisma.ServiceInquiryWhereInput = {
    ...query,
    ...(typeFilter ? { type: typeFilter } : {}),
  };

  const [inquiries, total, typeGroups, statusGroups] = await Promise.all([
    prisma.serviceInquiry.findMany({
      where: listWhere,
      orderBy: { createdAt: "desc" },
      skip: pageSkip(page),
      take: PAGE_SIZE,
    }),
    prisma.serviceInquiry.count({ where: listWhere }),
    prisma.serviceInquiry.groupBy({
      by: ["type"],
      where: typeCountWhere,
      _count: { _all: true },
    }),
    prisma.serviceInquiry.groupBy({
      by: ["status"],
      where: statusCountWhere,
      _count: { _all: true },
    }),
  ]);

  const typeCounts = Object.fromEntries(
    typeGroups.map((row) => [row.type, row._count?._all ?? 0])
  ) as Record<string, number>;
  const statusCounts = Object.fromEntries(
    statusGroups.map((row) => [row.status, row._count?._all ?? 0])
  ) as Record<string, number>;
  const typeAllCount = typeGroups.reduce((sum, row) => sum + (row._count?._all ?? 0), 0);
  const statusAllCount = statusGroups.reduce((sum, row) => sum + (row._count?._all ?? 0), 0);
  const totalPages = pageCount(total);

  const emptyTitle = q
    ? "No matching inquiries"
    : statusFilter === "NEW"
      ? "No new inquiries"
      : statusFilter === "CONTACTED"
        ? "No contacted inquiries"
        : statusFilter === "CLOSED"
          ? "No closed inquiries"
          : typeFilter
            ? `No ${SERVICE_INQUIRY_TAB_LABELS[typeFilter].toLowerCase()} inquiries`
            : "No messages yet";

  return (
    <main className="flex-1 bg-background">
      <PageHeader compact title="Inquiries" />

      <div className="container-console py-4 sm:py-6">
        <InquiryTypeTabs
          className="mb-3"
          type={typeFilter}
          status={statusFilter}
          q={q}
          counts={{
            all: typeAllCount,
            GENERAL: typeCounts.GENERAL ?? 0,
            START_A_BUSINESS: typeCounts.START_A_BUSINESS ?? 0,
            BUY_SELL: typeCounts.BUY_SELL ?? 0,
            ASSET_MANAGEMENT: typeCounts.ASSET_MANAGEMENT ?? 0,
            PROJECT_BANK: typeCounts.PROJECT_BANK ?? 0,
            CARBON: typeCounts.CARBON ?? 0,
          }}
        />
        <InquiryStatusTabs
          className="mb-5"
          type={typeFilter}
          status={statusFilter}
          q={q}
          counts={{
            all: statusAllCount,
            NEW: statusCounts.NEW ?? 0,
            CONTACTED: statusCounts.CONTACTED ?? 0,
            CLOSED: statusCounts.CLOSED ?? 0,
          }}
        />
        <div className="mb-5">
          <InquiriesSearchForm type={typeFilter} status={statusFilter} q={q} />
        </div>

        {inquiries.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={emptyTitle}
            description={
              q
                ? `Nothing matches “${q}” in this view.`
                : "Contact form messages appear here."
            }
          />
        ) : (
          <div className="space-y-3">
            {inquiries.map((inq) => (
              <ServiceInquiryRow
                key={inq.id}
                inquiry={{
                  ...inq,
                  createdAt: formatRelativeTime(inq.createdAt),
                  createdTitle: inq.createdAt.toLocaleString(),
                }}
              />
            ))}
          </div>
        )}

        {total > 0 ? (
          <div className="mt-6 space-y-3">
            <p className="text-center text-sm text-foreground/70">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <PagePagination page={page} totalPages={totalPages} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
