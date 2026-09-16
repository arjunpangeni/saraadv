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
import { DiscoverPageHeader } from "@/components/marketing/discover-page-header";
import { pageMetadata, itemListJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { LIST_PROJECT_HREF } from "@/lib/auth-utils";

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
            description: "Curated project teasers. Full dossiers are released by ASAR Partners after vetting and an NDA.",
            path: "/project-bank/discover",
            items: projects.map((p) => ({
              name: p.title,
              url: `${siteConfig.url}/project-bank/${p.slug}`,
            })),
          })}
        />
      ) : null}
      <DiscoverPageHeader
        eyebrow="Project Bank"
        title="Discover projects"
        description="Curated teasers first. Full dossiers stay with ASAR Partners until vetting and an NDA."
      />

      <section className="container-page pt-5 pb-20 sm:pt-6 sm:pb-28">
        <Suspense fallback={<div className="mb-5 h-10 animate-pulse rounded-full bg-muted/60" />}>
          <ProjectBankFilterBar resultCount={projects.length} />
        </Suspense>

        {projects.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title={hasFilters ? "No projects match your filters" : "No published projects yet"}
            description={
              hasFilters
                ? "Try a different sector or investment size, or clear the filters and browse again."
                : "Have a concept? List a teaser. ASAR Partners review it before it appears here."
            }
            action={
              hasFilters ? (
                <SmoothButton asChild variant="candy" size="sm">
                  <Link href="/project-bank/discover">Clear filters</Link>
                </SmoothButton>
              ) : (
                <SmoothButton asChild variant="candy" size="sm">
                  <Link href={LIST_PROJECT_HREF} prefetch={false}>
                    List your idea
                  </Link>
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

        <p className="mt-12 text-center text-[1.05rem] leading-[1.75] text-muted-foreground">
          Have a concept?{" "}
          <Link href={LIST_PROJECT_HREF} prefetch={false} className="font-semibold text-tz-blue-deep hover:underline">
            List your idea
          </Link>
          {" — "}we review it before it goes live.
        </p>
      </section>
    </main>
  );
}
