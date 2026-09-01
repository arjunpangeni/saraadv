import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma";
import { Building2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/console/page-header";
import { FilterTabs } from "@/components/console/filter-tabs";
import { BusinessSetupInquiryList } from "@/components/advisor/business-setup-inquiry-list";
import { BusinessSetupSearchForm } from "@/components/advisor/business-setup-search-form";
import {
  parseSetupDeskView,
  setupDeskHref,
  setupViewStatuses,
  type SetupDeskView,
} from "@/components/advisor/business-setup-desk";
import { PagePagination } from "@/components/console/page-pagination";
import { prisma } from "@/lib/prisma";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { PAGE_SIZE, pageCount, pageSkip, parsePage } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Business setups",
};

function searchWhere(q: string, fdi: boolean): Prisma.BusinessSetupWhereInput {
  const query = q.trim();
  return {
    ...(fdi ? { fdiRequested: true } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { contactName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query } },
          ],
        }
      : {}),
  };
}

const EMPTY_TITLE: Record<SetupDeskView, string> = {
  new: "No new requests yet",
  working: "Nothing in progress",
  contacted: "No contacted requests",
  done: "No completed requests",
  archived: "No archived requests",
};

export default async function AdvisorBusinessSetupsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; page?: string; q?: string; fdi?: string }>;
}) {
  const { view: viewParam, page: pageParam, q: qParam, fdi: fdiParam } = await searchParams;
  const view = parseSetupDeskView(viewParam);
  const page = parsePage(pageParam);
  const q = qParam?.trim() ?? "";
  const fdi = fdiParam === "1";
  const query = searchWhere(q, fdi);
  const where = { status: { in: setupViewStatuses(view) }, ...query };

  const [setups, total, newCount, workingCount, contactedCount, doneCount, archivedCount] = await Promise.all([
    prisma.businessSetup.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        investment: true,
        addresses: true,
      },
      skip: pageSkip(page),
      take: PAGE_SIZE,
    }),
    prisma.businessSetup.count({ where }),
    prisma.businessSetup.count({ where: { status: { in: setupViewStatuses("new") }, ...query } }),
    prisma.businessSetup.count({ where: { status: { in: setupViewStatuses("working") }, ...query } }),
    prisma.businessSetup.count({ where: { status: { in: setupViewStatuses("contacted") }, ...query } }),
    prisma.businessSetup.count({ where: { status: { in: setupViewStatuses("done") }, ...query } }),
    prisma.businessSetup.count({ where: { status: { in: setupViewStatuses("archived") }, ...query } }),
  ]);

  return (
    <main className="flex-1 bg-background">
      <PageHeader compact title="Business setups" />
      <div className="container-console py-4 sm:py-5">
        <FilterTabs
          wrap
          className="mb-5"
          items={[
            {
              href: setupDeskHref({ view: "new", q, fdi }),
              label: `New (${newCount})`,
              active: view === "new",
            },
            {
              href: setupDeskHref({ view: "working", q, fdi }),
              label: `Working (${workingCount})`,
              active: view === "working",
            },
            {
              href: setupDeskHref({ view: "contacted", q, fdi }),
              label: `Contacted (${contactedCount})`,
              active: view === "contacted",
            },
            {
              href: setupDeskHref({ view: "done", q, fdi }),
              label: `Done (${doneCount})`,
              active: view === "done",
            },
            {
              href: setupDeskHref({ view: "archived", q, fdi }),
              label: `Archived (${archivedCount})`,
              active: view === "archived",
            },
          ]}
        />
        <div className="mb-5">
          <BusinessSetupSearchForm view={view} q={q} fdi={fdi} />
        </div>

        <BusinessSetupInquiryList
          manage
          empty={
            <EmptyState
              icon={Building2}
              title={q || fdi ? "No matching requests" : EMPTY_TITLE[view]}
              description={
                q || fdi
                  ? "Try another search or clear the FDI filter."
                  : view === "new"
                    ? "Start-a-business inquiries appear here after someone submits the intake form."
                    : "Switch filters to see other setup requests."
              }
            />
          }
          inquiries={setups.map((s) => ({
            id: s.id,
            name: s.name,
            contactName: s.contactName,
            phone: s.phone,
            email: s.email,
            objective: s.objective,
            businessType: s.businessType,
            fdiRequested: s.fdiRequested,
            status: s.status,
            createdAt: s.createdAt.toISOString(),
            submittedAt: formatRelativeTime(s.createdAt),
            submittedTitle: s.createdAt.toLocaleString(),
            fromView: view,
            addresses: s.addresses.map((a) => ({
              kind: a.kind,
              district: a.district,
              localBody: a.localBody,
            })),
            investment: s.investment
              ? {
                  equityInvestment: Number(s.investment.equityInvestment),
                  loanInvestment: Number(s.investment.loanInvestment),
                }
              : null,
          }))}
        />

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
