import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { auth } from "@/lib/auth";
import { getSignedDownloadUrl } from "@/lib/storage";
import { logEvent } from "@/lib/analytics";
import { canPreviewUnpublishedProject, findPublicTeaser, findPublishedTeaserMeta } from "@/lib/project-bank";
import { capexLabel, irrLabel, sectorLabel, stageLabel } from "@/types/project-bank";
import { ProjectLeadModal } from "@/components/project-bank/lead-modal";
import { ProjectVisuals } from "@/components/project-bank/project-visuals";
import { GatedVaultPreview } from "@/components/project-bank/gated-vault-preview";
import { PageBreadcrumbs } from "@/components/marketing/page-breadcrumbs";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await findPublishedTeaserMeta(slug);
  if (!project) {
    return { title: "Project | Project Bank", robots: { index: false, follow: false } };
  }
  return {
    ...pageMetadata({
      title: `${project.title} | Project Bank`,
      description: project.elevatorPitch,
      path: `/project-bank/${project.slug}`,
      ogTitle: `${project.title} | Investment opportunity in Nepal`,
    }),
    robots: { index: true, follow: true },
  };
}

export default async function ProjectTeaserPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const project = await findPublicTeaser(slug);
  if (!project) notFound();

  if (project.id === slug && project.slug !== slug) {
    redirect(`/project-bank/${project.slug}`);
  }

  const canView = canPreviewUnpublishedProject(project, session?.user?.id, session?.user?.role);
  if (!canView) notFound();

  if (project.status === "PUBLISHED") {
    await logEvent({
      type: "project_view",
      sessionId: session?.user?.id ?? "anonymous",
      userId: session?.user?.id,
      entityType: "ProjectListing",
      entityId: project.id,
    });
  }

  const isPreview = project.status !== "PUBLISHED";
  const imageUrls = (
    await Promise.all(project.assets.slice(0, 2).map((asset) => getSignedDownloadUrl(asset.s3Key, 3600)))
  ).filter((url): url is string => Boolean(url));

  return (
    <main className="flex-1">
      <div className="container-page py-16 sm:py-20">
        <PageBreadcrumbs
          items={[
            { name: "Project Bank", href: "/project-bank" },
            { name: "Discover", href: "/project-bank/discover" },
            { name: project.title },
          ]}
        />
        {isPreview && (
          <div className="mt-4 rounded-lg border border-border bg-warning-bg px-4 py-2.5 text-sm text-warning-fg">
            Preview only — this project is not yet published on the discovery grid.
            {session?.user?.id === project.ownerId
              ? " Confidential Vault fields are held by ASAR Partners and are not shown here."
              : ""}
          </div>
        )}

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[480px_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-24">
            <ProjectVisuals title={project.title} imageUrls={imageUrls} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm text-foreground/60">
              <span className="rounded-md bg-tz-green px-2 py-0.5 text-[11px] font-semibold text-tz-green-deep">
                {sectorLabel(project.sector)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden />
                {project.broadRegion}
              </span>
              <span className="text-foreground/25">·</span>
              <span>{stageLabel(project.fundingStage)}</span>
            </div>

            <h1 className="heading-soft mt-3 text-pretty font-heading text-[1.7rem] font-semibold tracking-[-0.015em] text-foreground sm:text-[2rem]">
              {project.title}
            </h1>

            <p className="mt-4 max-w-2xl text-pretty text-[1.05rem] leading-[1.75] text-muted-foreground">
              {project.elevatorPitch}
            </p>

            <dl className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border bg-border">
              <div className="bg-card px-3 py-3 sm:px-4 sm:py-4">
                <dt className="text-[10px] font-medium tracking-wide text-foreground/50 uppercase">CAPEX</dt>
                <dd className="heading-soft mt-1 break-words font-heading text-sm font-semibold tracking-[-0.015em] text-foreground sm:text-lg">
                  {capexLabel(project.capexRange)}
                </dd>
              </div>
              <div className="bg-card px-3 py-3 sm:px-4 sm:py-4">
                <dt className="text-[10px] font-medium tracking-wide text-foreground/50 uppercase">Target IRR</dt>
                <dd className="heading-soft mt-1 break-words font-heading text-sm font-semibold tracking-[-0.015em] text-foreground sm:text-lg">
                  {irrLabel(project.targetRoiIrr)}
                </dd>
              </div>
              <div className="bg-card px-3 py-3 sm:px-4 sm:py-4">
                <dt className="text-[10px] font-medium tracking-wide text-foreground/50 uppercase">Stage</dt>
                <dd className="heading-soft mt-1 break-words font-heading text-sm font-semibold tracking-[-0.015em] text-foreground sm:text-lg">
                  {stageLabel(project.fundingStage)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 space-y-4">
              <GatedVaultPreview />
              {!isPreview ? (
                <ProjectLeadModal compact projectId={project.id} projectSlug={project.slug} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
