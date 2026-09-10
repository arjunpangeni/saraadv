import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Landmark, Lock, MapPin } from "lucide-react";
import { capexLabel, irrLabel, sectorLabel, stageLabel } from "@/types/project-bank";

export type ProjectCardData = {
  slug: string;
  title: string;
  sector: string;
  broadRegion: string;
  elevatorPitch: string;
  capexRange: string;
  targetRoiIrr: string;
  fundingStage: string;
  thumbnailUrl?: string | null;
  imageUrls?: string[];
  priority?: boolean;
};

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const images = (project.imageUrls?.filter(Boolean) ?? []).slice(0, 2);
  const cover = images[0] ?? project.thumbnailUrl ?? null;
  const second = images[1] ?? null;

  return (
    <article className="group h-full">
      <Link
        href={`/project-bank/${project.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-card-hover)]"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-surface-muted">
          {cover ? (
            <Image
              src={cover}
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
              priority={project.priority}
              unoptimized
            />
          ) : (
            <span className="flex h-full items-center justify-center">
              <Landmark className="size-9 text-foreground/25" aria-hidden />
            </span>
          )}
          {second ? (
            <span className="absolute right-2.5 bottom-2.5 hidden h-16 w-[4.5rem] overflow-hidden rounded-lg border border-white/70 shadow-md sm:block">
              <Image src={second} alt="" fill className="object-cover" sizes="72px" unoptimized />
            </span>
          ) : null}
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />
          <span className="absolute top-2.5 left-2.5 rounded-md bg-background/92 px-2 py-0.5 text-[11px] font-semibold text-tz-blue-deep shadow-sm">
            {sectorLabel(project.sector)}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <p className="flex items-center gap-1 text-xs text-foreground/55">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{project.broadRegion}</span>
          </p>
          <h3 className="heading-soft mt-1.5 line-clamp-2 text-pretty font-heading text-lg font-semibold tracking-[-0.015em] text-foreground group-hover:text-tz-blue-deep sm:text-xl">
            {project.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-pretty text-[1.05rem] leading-[1.75] text-muted-foreground">
            {project.elevatorPitch}
          </p>

          <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-border">
            <div className="bg-surface-muted/70 px-2.5 py-2.5">
              <dt className="text-[10px] font-medium tracking-wide text-foreground/50 uppercase">CAPEX</dt>
              <dd className="heading-soft mt-0.5 break-words font-heading text-xs font-semibold tracking-[-0.015em] text-foreground sm:text-sm">
                {capexLabel(project.capexRange)}
              </dd>
            </div>
            <div className="bg-surface-muted/70 px-2.5 py-2.5">
              <dt className="text-[10px] font-medium tracking-wide text-foreground/50 uppercase">IRR</dt>
              <dd className="heading-soft mt-0.5 break-words font-heading text-xs font-semibold tracking-[-0.015em] text-foreground sm:text-sm">
                {irrLabel(project.targetRoiIrr)}
              </dd>
            </div>
            <div className="bg-surface-muted/70 px-2.5 py-2.5">
              <dt className="text-[10px] font-medium tracking-wide text-foreground/50 uppercase">Stage</dt>
              <dd className="heading-soft mt-0.5 break-words font-heading text-xs font-semibold tracking-[-0.015em] text-foreground sm:text-sm">
                {stageLabel(project.fundingStage)}
              </dd>
            </div>
          </dl>

          <div className="mt-auto flex items-center justify-between pt-4">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/45">
              <Lock className="size-3" aria-hidden />
              Public teaser
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-tz-blue-deep">
              View teaser
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
