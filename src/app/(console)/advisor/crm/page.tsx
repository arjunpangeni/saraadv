import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma";
import { Briefcase } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/console/page-header";
import { PagePagination } from "@/components/console/page-pagination";
import {
  CrmFilterTabs,
  CrmViewTabs,
  crmViewStatuses,
  parseCrmTab,
  parseCrmView,
  type CrmView,
} from "@/components/advisor/crm-desk";
import { CrmSearchForm } from "@/components/advisor/crm-search-form";
import { DealLeadRow } from "@/components/advisor/deal-lead-row";
import { prisma } from "@/lib/prisma";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { PAGE_SIZE, pageCount, pageSkip, parsePage } from "@/lib/pagination";
import { industryLabel } from "@/types/listing";
import { INVESTMENT_TIMEFRAME_LABELS, INVESTOR_TYPE_LABELS } from "@/types/project-bank";

export const metadata: Metadata = {
  title: "Deal-flow CRM",
};

function searchWhere(q: string): Prisma.ListingLeadWhereInput {
  const query = q.trim();
  if (!query) return {};
  return {
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      { firm: { contains: query, mode: "insensitive" } },
    ],
  };
}

const EMPTY_TITLES: Record<CrmView, { buyers: string; investors: string }> = {
  action: { buyers: "No buyer leads needing action", investors: "No investor leads needing action" },
  progress: { buyers: "No buyers in progress", investors: "No investors in progress" },
  released: { buyers: "No released buyer dossiers", investors: "No released investor dossiers" },
  rejected: { buyers: "No rejected buyer leads", investors: "No rejected investor leads" },
};

export default async function AdvisorCrmPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; view?: string; q?: string; page?: string }>;
}) {
  const { tab: tabParam, view: viewParam, q: qParam, page: pageParam } = await searchParams;
  const tab = parseCrmTab(tabParam);
  const view = parseCrmView(viewParam);
  const q = qParam?.trim() ?? "";
  const page = parsePage(pageParam);
  const statuses = crmViewStatuses(view);
  const query = searchWhere(q);

  const [buyerLeads, investorLeads, filteredTotal, buyerActionCount, investorActionCount, actionCount, progressCount, releasedCount, rejectedCount] =
    await Promise.all([
      tab === "buyers"
        ? prisma.listingLead.findMany({
            where: { status: { in: statuses }, ...query },
            orderBy: { createdAt: "desc" },
            skip: pageSkip(page),
            take: PAGE_SIZE,
            include: {
              listing: {
                select: {
                  hashId: true,
                  industry: true,
                  organization: { select: { name: true } },
                },
              },
            },
          })
        : Promise.resolve([]),
      tab === "investors"
        ? prisma.projectLead.findMany({
            where: { status: { in: statuses }, ...query },
            orderBy: { createdAt: "desc" },
            skip: pageSkip(page),
            take: PAGE_SIZE,
            include: { project: { select: { title: true, slug: true } } },
          })
        : Promise.resolve([]),
      tab === "buyers"
        ? prisma.listingLead.count({ where: { status: { in: statuses }, ...query } })
        : prisma.projectLead.count({ where: { status: { in: statuses }, ...query } }),
      prisma.listingLead.count({ where: { status: { in: crmViewStatuses("action") } } }),
      prisma.projectLead.count({ where: { status: { in: crmViewStatuses("action") } } }),
      tab === "buyers"
        ? prisma.listingLead.count({ where: { status: { in: crmViewStatuses("action") }, ...query } })
        : prisma.projectLead.count({ where: { status: { in: crmViewStatuses("action") }, ...query } }),
      tab === "buyers"
        ? prisma.listingLead.count({ where: { status: { in: crmViewStatuses("progress") }, ...query } })
        : prisma.projectLead.count({ where: { status: { in: crmViewStatuses("progress") }, ...query } }),
      tab === "buyers"
        ? prisma.listingLead.count({ where: { status: { in: crmViewStatuses("released") }, ...query } })
        : prisma.projectLead.count({ where: { status: { in: crmViewStatuses("released") }, ...query } }),
      tab === "buyers"
        ? prisma.listingLead.count({ where: { status: { in: crmViewStatuses("rejected") }, ...query } })
        : prisma.projectLead.count({ where: { status: { in: crmViewStatuses("rejected") }, ...query } }),
    ]);

  const leads = tab === "buyers" ? buyerLeads : investorLeads;
  const totalPages = pageCount(filteredTotal);

  return (
    <main className="flex-1 bg-background">
      <PageHeader compact title="Deal-flow CRM" />

      <div className="container-console py-4 sm:py-6">
        <CrmFilterTabs
          className="mb-3"
          active={tab}
          view={view}
          q={q}
          counts={{ buyers: buyerActionCount, investors: investorActionCount }}
        />
        <CrmViewTabs
          className="mb-5"
          tab={tab}
          active={view}
          q={q}
          counts={{
            action: actionCount,
            progress: progressCount,
            released: releasedCount,
            rejected: rejectedCount,
          }}
        />
        <div className="mb-5">
          <CrmSearchForm tab={tab} view={view} q={q} />
        </div>

        {leads.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={q ? "No matching leads" : EMPTY_TITLES[view][tab]}
            description={
              q
                ? `Nothing matches “${q}” in this view.`
                : tab === "buyers"
                  ? "Profile requests on sale listings appear here."
                  : "Dossier requests on project ideas appear here."
            }
          />
        ) : (
          <div className="space-y-3">
            {tab === "buyers"
              ? buyerLeads.map((lead) => (
                  <DealLeadRow
                    key={lead.id}
                    kind="buyer"
                    id={lead.id}
                    name={lead.name}
                    firm={lead.firm}
                    email={lead.email}
                    phone={lead.phone}
                    investorType={INVESTOR_TYPE_LABELS[lead.investorType]}
                    timeframe={INVESTMENT_TIMEFRAME_LABELS[lead.investmentTimeframe]}
                    targetLabel={lead.listing.hashId}
                    targetHref={`/marketplace/${lead.listing.hashId}`}
                    targetCompany={lead.listing.organization?.name || "Unnamed company"}
                    targetMeta={industryLabel(lead.listing.industry)}
                    verified={lead.isEmailVerified}
                    status={lead.status}
                    notes={lead.adminNotes}
                    createdAt={formatRelativeTime(lead.createdAt)}
                    createdTitle={lead.createdAt.toLocaleString()}
                  />
                ))
              : investorLeads.map((lead) => (
                  <DealLeadRow
                    key={lead.id}
                    kind="investor"
                    id={lead.id}
                    name={lead.name}
                    firm={lead.firm}
                    email={lead.email}
                    phone={lead.phone}
                    investorType={INVESTOR_TYPE_LABELS[lead.investorType]}
                    timeframe={INVESTMENT_TIMEFRAME_LABELS[lead.investmentTimeframe]}
                    targetLabel={lead.project.title}
                    targetHref={`/project-bank/${lead.project.slug}`}
                    verified={lead.isEmailVerified}
                    status={lead.status}
                    notes={lead.adminNotes}
                    createdAt={formatRelativeTime(lead.createdAt)}
                    createdTitle={lead.createdAt.toLocaleString()}
                  />
                ))}
          </div>
        )}

        {filteredTotal > 0 ? (
          <div className="mt-6 space-y-3">
            <p className="text-center text-sm text-foreground/70">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredTotal)} of {filteredTotal}
            </p>
            <PagePagination page={page} totalPages={totalPages} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
