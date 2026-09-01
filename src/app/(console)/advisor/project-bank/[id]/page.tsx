import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/console/page-header";
import SmoothButton from "@/components/smoothui/smooth-button";
import { ProjectReviewEditor } from "@/components/advisor/project-review-editor";
import { requireDesk } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { getSignedDownloadUrl } from "@/lib/storage";
import { parseProjectBankFilter, projectBankHref } from "@/components/advisor/project-bank-desk";

export default async function AdvisorProjectReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  await requireDesk("/advisor/project-bank");
  const { id } = await params;
  const { from: fromParam } = await searchParams;
  const backHref = projectBankHref({ status: parseProjectBankFilter(fromParam) });
  const project = await prisma.projectListing.findUnique({
    where: { id },
    include: {
      vault: true,
      assets: true,
      owner: { select: { id: true, name: true, email: true } },
    },
  });
  if (!project) notFound();

  const vault = project.vault;
  const imageUrls = (
    await Promise.all(project.assets.slice(0, 2).map((asset) => getSignedDownloadUrl(asset.s3Key, 3600)))
  ).filter((url): url is string => Boolean(url));

  return (
    <main className="flex-1 bg-background">
      <PageHeader
        compact
        eyebrow="Advisor desk"
        title={project.title}
        description={`${project.owner.name || project.owner.email} · ${project.status.replace(/_/g, " ")}`}
        actions={
          <SmoothButton asChild variant="outline" size="sm">
            <Link href={backHref}>Back to queue</Link>
          </SmoothButton>
        }
      />
      <div className="container-console py-4 sm:py-5">
        <ProjectReviewEditor
          projectId={project.id}
          slug={project.slug}
          status={project.status}
          editedByAdmin={project.editedByAdmin}
          initialTeaser={{
            title: project.title,
            sector: project.sector,
            broadRegion: project.broadRegion,
            elevatorPitch: project.elevatorPitch,
            capexRange: project.capexRange,
            targetRoiIrr: project.targetRoiIrr,
            fundingStage: project.fundingStage,
          }}
          initialContact={{
            exactAddress: vault?.exactAddress ?? "",
            founderFullName: vault?.founderFullName ?? "",
            founderPhone: vault?.founderPhone ?? "",
          }}
          loginEmail={project.owner.email}
          imageUrls={imageUrls}
          redirectTo={backHref}
        />
      </div>
    </main>
  );
}
