import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Landmark, Mail, MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SmoothButton from "@/components/smoothui/smooth-button";
import { cn } from "@/lib/utils";

function statusBadge(status: string) {
  if (status === "PUBLISHED") return { label: "Live", variant: "success" as const };
  if (status === "REJECTED") return { label: "Rejected", variant: "danger" as const };
  if (status === "ARCHIVED") return { label: "Archived", variant: "default" as const };
  if (status === "DRAFT") return { label: "Draft", variant: "secondary" as const };
  return { label: "Awaiting review", variant: "warning" as const };
}

function ctaLabel(status: string) {
  if (status === "PUBLISHED") return "Edit teaser";
  if (status === "REJECTED" || status === "ARCHIVED") return "Open";
  return "Review teaser";
}

export function ProjectIdeaRequestCard({
  href,
  title,
  imageUrls,
  sector,
  region,
  pitch,
  capex,
  irr,
  stage,
  status,
  editedByAdmin,
  listedBy,
  email,
  phone,
  site,
  submittedAt,
  submittedTitle,
  actions,
}: {
  href: string;
  title: string;
  imageUrls: string[];
  sector: string;
  region: string;
  pitch: string;
  capex: string;
  irr: string;
  stage: string;
  status: string;
  editedByAdmin?: boolean;
  listedBy: string;
  email?: string | null;
  phone?: string | null;
  site?: string | null;
  submittedAt: string;
  submittedTitle?: string;
  actions?: ReactNode;
}) {
  const badge = statusBadge(status);
  const cover = imageUrls[0] ?? null;
  const second = imageUrls[1] ?? null;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)] transition-colors hover:border-brand-sky/40",
        status === "PENDING_REVIEW" ? "border-warning/40" : "border-border"
      )}
    >
      <div className="flex flex-col sm:flex-row">
        <Link
          href={href}
          className="relative isolate block aspect-[16/10] shrink-0 overflow-hidden bg-surface-muted sm:aspect-auto sm:w-56 sm:min-h-[12rem] sm:self-stretch"
        >
          {cover && second ? (
            <span className="absolute inset-0 grid grid-rows-2 gap-px bg-border">
              <span className="relative overflow-hidden">
                <Image src={cover} alt="" fill className="object-cover" unoptimized sizes="224px" />
              </span>
              <span className="relative overflow-hidden">
                <Image src={second} alt="" fill className="object-cover" unoptimized sizes="224px" />
              </span>
            </span>
          ) : cover ? (
            <Image src={cover} alt="" fill className="object-cover" unoptimized sizes="224px" />
          ) : (
            <span className="flex h-full min-h-36 items-center justify-center sm:min-h-full">
              <Landmark className="size-8 text-foreground/25" aria-hidden />
            </span>
          )}
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />
          <span className="absolute top-2.5 left-2.5 rounded-md bg-background/90 px-2 py-0.5 text-[11px] font-semibold text-brand-sky shadow-sm">
            {sector}
          </span>
        </Link>

        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={href}
                className="font-display text-lg font-extrabold tracking-tight text-foreground hover:text-brand-sky"
              >
                {title}
              </Link>
              <p className="mt-0.5 text-sm text-foreground/55">{region}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={badge.variant}>{badge.label}</Badge>
              {editedByAdmin ? <Badge variant="warning">Edited</Badge> : null}
            </div>
          </div>

          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground/70">{pitch}</p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-surface-muted px-2 py-1 text-xs text-foreground/80">
              <span className="font-medium text-foreground/50">CAPEX </span>
              <span className="font-semibold text-foreground">{capex}</span>
            </span>
            <span className="rounded-md bg-surface-muted px-2 py-1 text-xs text-foreground/80">
              <span className="font-medium text-foreground/50">IRR </span>
              <span className="font-semibold text-foreground">{irr}</span>
            </span>
            <span className="rounded-md bg-surface-muted px-2 py-1 text-xs text-foreground/80">
              <span className="font-medium text-foreground/50">Stage </span>
              <span className="font-semibold text-foreground">{stage}</span>
            </span>
          </div>

          <div className="mt-3">
            <p className="text-sm font-medium text-foreground">{listedBy}</p>
            <div className="mt-1 flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:gap-x-4">
              {email ? (
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-1.5 text-foreground/70 hover:text-brand-sky"
                >
                  <Mail className="size-3.5 shrink-0" aria-hidden />
                  {email}
                </a>
              ) : null}
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-1.5 text-foreground/70 hover:text-brand-sky"
                >
                  <Phone className="size-3.5 shrink-0" aria-hidden />
                  {phone}
                </a>
              ) : null}
              {site ? (
                <span className="inline-flex items-start gap-1.5 text-foreground/65">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>{site}</span>
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-border-subtle pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-foreground/50" title={submittedTitle}>
              Submitted {submittedAt}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <SmoothButton asChild variant="candy" size="sm">
                <Link href={href}>{ctaLabel(status)}</Link>
              </SmoothButton>
              {actions}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
