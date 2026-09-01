import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma";
import { Landmark } from "lucide-react";
import { ProjectStatus } from "@prisma/client";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/console/page-header";
import { FilterTabs } from "@/components/console/filter-tabs";
import { ProjectIdeaRequestCard } from "@/components/advisor/project-idea-request-card";
import { ProjectReviewActions } from "@/components/advisor/project-review-actions";
import { ProjectBankSearchForm } from "@/components/advisor/project-bank-search-form";
import {
  parseProjectBankFilter,
  projectBankHref,
  type ProjectBankFilter,
} from "@/components/advisor/project-bank-desk";
import { prisma } from "@/lib/prisma";
import { getSignedDownloadUrl } from "@/lib/storage";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { PAGE_SIZE, pageCount, pageSkip, parsePage } from "@/lib/pagination";
import { PagePagination } from "@/components/console/page-pagination";
import { capexLabel, irrLabel, sectorLabel, stageLabel } from "@/types/project-bank";

function reviewWhereFor(filter: ProjectBankFilter) {
  if (filter === "live") return { status: ProjectStatus.PUBLISHED };
  if (filter === "rejected") return { status: ProjectStatus.REJECTED };
  return { status: ProjectStatus.PENDING_REVIEW };
}

function searchWhere(q: string): Prisma.ProjectListingWhereInput {
  const query = q.trim();
  if (!query) return {};
  return {
    OR: [
      { title: { contains: query, mode: "insensitive" } },
      { elevatorPitch: { contains: query, mode: "insensitive" } },
      { broadRegion: { contains: query, mode: "insensitive" } },
      { owner: { name: { contains: query, mode: "insensitive" } } },
      { owner: { email: { contains: query, mode: "insensitive" } } },
      { vault: { founderFullName: { contains: query, mode: "insensitive" } } },
      { vault: { founderEmail: { contains: query, mode: "insensitive" } } },
    ],
  };
}

export default async function AdvisorProjectBankDeskPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; status?: string; q?: string }>;
}) {
  const { tab: tabParam, page: pageParam, status: statusParam, q: qParam } = await searchParams;
  if (tabParam === "leads") redirect("/advisor/crm?tab=investors");

  const page = parsePage(pageParam);
  const reviewFilter = parseProjectBankFilter(statusParam);
  const q = qParam?.trim() ?? "";
  const query = searchWhere(q);
  const reviewWhere = { ...reviewWhereFor(reviewFilter), ...query };

  const [projects, pendingQueue, liveCount, rejectedCount, reviewTotal] = await Promise.all([
    prisma.projectListing.findMany({
      where: reviewWhere,
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        assets: { take: 1, orderBy: { id: "asc" } },
        vault: true,
      },
      skip: pageSkip(page),
      take: PAGE_SIZE,
    }),
    prisma.projectListing.count({ where: { status: ProjectStatus.PENDING_REVIEW } }),
    prisma.projectListing.count({ where: { status: ProjectStatus.PUBLISHED } }),
    prisma.projectListing.count({ where: { status: ProjectStatus.REJECTED } }),
    prisma.projectListing.count({ where: reviewWhere }),
  ]);

  const coverSets = await Promise.all(
    projects.map(async (p) => {
      const key = p.assets[0]?.s3Key;
      if (!key) return [] as string[];
      const url = await getSignedDownloadUrl(key, 3600);
      return url ? [url] : [];
    })
  );

  return (
    <main className="flex-1 bg-background">
      <PageHeader compact title="Project ideas" />
      <div className="container-console py-4 sm:py-5">
        <FilterTabs
          className="mb-5"
          items={[
            {
              href: projectBankHref({ status: "pending", q }),
              label: `Pending (${pendingQueue})`,
              active: reviewFilter === "pending",
            },
            {
              href: projectBankHref({ status: "live", q }),
              label: `Live (${liveCount})`,
              active: reviewFilter === "live",
            },
            {
              href: projectBankHref({ status: "rejected", q }),
              label: `Rejected (${rejectedCount})`,
              active: reviewFilter === "rejected",
            },
          ]}
        />
        <div className="mb-5">
          <ProjectBankSearchForm status={reviewFilter} q={q} />
        </div>

        {projects.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title={
              q
                ? "No matching ideas"
                : reviewFilter === "live"
                  ? "No live teasers"
                  : reviewFilter === "rejected"
                    ? "No rejected ideas"
                    : "Nothing awaiting review"
            }
            description={
              q
                ? `Nothing matches “${q}” in this view.`
                : reviewFilter === "pending"
                  ? "Entrepreneur teasers appear here after submission."
                  : "Switch filters to see other project ideas."
            }
          />
        ) : (
          <div className="space-y-4">
            {projects.map((p, i) => (
              <ProjectIdeaRequestCard
                key={p.id}
                href={`/advisor/project-bank/${p.id}?from=${reviewFilter}`}
                title={p.title}
                imageUrls={coverSets[i] ?? []}
                sector={sectorLabel(p.sector)}
                region={p.broadRegion}
                pitch={p.elevatorPitch}
                capex={capexLabel(p.capexRange)}
                irr={irrLabel(p.targetRoiIrr)}
                stage={stageLabel(p.fundingStage)}
                status={p.status}
                editedByAdmin={p.editedByAdmin}
                listedBy={p.vault?.founderFullName.trim() || p.owner.name?.trim() || "Unnamed account"}
                email={p.owner.email || p.vault?.founderEmail}
                phone={p.vault?.founderPhone}
                site={p.vault?.exactAddress}
                submittedAt={formatRelativeTime(p.createdAt)}
                submittedTitle={p.createdAt.toLocaleString()}
                actions={
                  <ProjectReviewActions
                    compact
                    projectId={p.id}
                    slug={p.slug}
                    status={p.status}
                    title={p.title}
                    redirectTo={projectBankHref({ status: reviewFilter, q })}
                  />
                }
              />
            ))}
          </div>
        )}

        {reviewTotal > 0 ? (
          <div className="mt-6 space-y-3">
            <p className="text-center text-sm text-foreground/70">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, reviewTotal)} of {reviewTotal}
            </p>
            <PagePagination page={page} totalPages={pageCount(reviewTotal)} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
