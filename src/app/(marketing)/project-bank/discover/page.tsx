import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Landmark } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import SmoothButton from "@/components/smoothui/smooth-button";
import { ProjectBankFilterBar } from "@/components/project-bank/filter-bar";
import { ProjectCardGrid } from "@/components/project-bank/project-card-grid";
import { getPublicProjects } from "@/lib/project-bank";
import { getSignedDownloadUrl } from "@/lib/storage";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata, itemListJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = pageMetadata({
  title: "Project Bank - Discover Investment Opportunities",
  description: "Browse curated pre-seed concepts and high-yield project opportunities across Nepal.",
  path: "/project-bank/discover",
  ogTitle: "Discover investment opportunities in Nepal | Project Bank",
});

export const revalidate = 60;

export default async function ProjectDiscoverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const hasFilters = Boolean(sp.sector || sp.capexRange || sp.capexBand || sp.fundingStage);
  const projects = await getPublicProjects({
    sector: sp.sector,
    capexRange: sp.capexRange || sp.capexBand,
    fundingStage: sp.fundingStage,
  });

  const coverSets = await Promise.all(
    projects.map(async (p) => {
      const urls = await Promise.all(
        p.assets.slice(0, 2).map((asset) => getSignedDownloadUrl(asset.s3Key, 3600))
      );
      return urls.filter((url): url is string => Boolean(url));
    })
  );

  return (
    <main className="flex-1">
      {projects.length > 0 ? (
        <JsonLd
          data={itemListJsonLd({
            name: "Project Bank investment opportunities in Nepal",
            description: "Curated project teasers. Full dossiers are released by SARA Advisors after vetting and an NDA.",
            path: "/project-bank/discover",
            items: projects.map((p) => ({
              name: p.title,
              url: `${siteConfig.url}/project-bank/${p.slug}`,
            })),
          })}
        />
      ) : null}
      <div className="container-page py-8 sm:py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium tracking-tight text-brand-sky">Project Bank</p>
            <h1 className="mt-1 text-pretty font-display text-3xl font-extrabold tracking-tight text-foreground">
              Discover projects
            </h1>
          </div>
          <SmoothButton asChild variant="candy">
            <Link href="/project-bank/new">List your idea</Link>
          </SmoothButton>
        </div>

        <Suspense
          fallback={<div className="mb-6 h-10 animate-pulse rounded-lg border border-border bg-card" />}
        >
          <ProjectBankFilterBar resultCount={projects.length} />
        </Suspense>

        {projects.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title={hasFilters ? "No projects match your filters" : "No published projects yet"}
            description={
              hasFilters
                ? "Try a different sector or investment size, or clear the filters and browse again."
                : "Have a concept? List a teaser. SARA Advisors review it before it appears here."
            }
            action={
              hasFilters ? (
                <SmoothButton asChild variant="candy" size="sm">
                  <Link href="/project-bank/discover">Clear filters</Link>
                </SmoothButton>
              ) : (
                <SmoothButton asChild variant="candy" size="sm">
                  <Link href="/project-bank/new">List your idea</Link>
                </SmoothButton>
              )
            }
          />
        ) : (
          <ProjectCardGrid
            projects={projects.map((p, i) => ({
              slug: p.slug,
              title: p.title,
              sector: p.sector,
              broadRegion: p.broadRegion,
              elevatorPitch: p.elevatorPitch,
              capexRange: p.capexRange,
              targetRoiIrr: p.targetRoiIrr,
              fundingStage: p.fundingStage,
              imageUrls: coverSets[i] ?? [],
            }))}
          />
        )}

        <p className="mt-8 text-center text-sm leading-relaxed text-foreground/70">
          Have a concept?{" "}
          <Link href="/project-bank/new" className="font-medium text-brand-sky hover:underline">
            List your idea
          </Link>
          {" — "}we review it before it goes live.
        </p>
      </div>
    </main>
  );
}
