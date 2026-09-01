import type { ReactNode } from "react";
import Link from "next/link";
import { Building2, Mail, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import SmoothButton from "@/components/smoothui/smooth-button";
import { cn } from "@/lib/utils";
import { industryLabel, modalityLabel } from "@/types/listing";

function statusBadge(status: string) {
  if (status === "PUBLISHED") return { label: "Live", variant: "success" as const };
  if (status === "WITHDRAWN") return { label: "Rejected", variant: "danger" as const };
  if (status === "DRAFT") return { label: "Draft", variant: "secondary" as const };
  return { label: "Awaiting review", variant: "warning" as const };
}

export function ListingRequestCard({
  hashId,
  companyName,
  industry,
  asking,
  modality,
  district,
  provinces,
  sellerName,
  sellerEmail,
  status,
  submittedAt,
  submittedTitle,
  actions,
}: {
  hashId: string;
  companyName?: string | null;
  industry: string;
  asking: string;
  modality?: string | null;
  district?: string | null;
  provinces: string[];
  sellerName: string;
  sellerEmail: string;
  status: string;
  submittedAt: string;
  submittedTitle?: string;
  actions?: ReactNode;
}) {
  const badge = statusBadge(status);
  const place = [district, provinces.filter((p) => p !== district).join(", ")].filter(Boolean).join(" · ");

  return (
    <article
      id={hashId}
      className={cn(
        "scroll-mt-24 overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)] transition-colors hover:border-brand-sky/40",
        status === "PENDING_REVIEW" ? "border-warning/40" : "border-border"
      )}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative isolate flex shrink-0 flex-col justify-between bg-brand-sky-muted p-4 sm:w-52 sm:self-stretch">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-sky">
              <Building2 className="size-3.5" aria-hidden />
              {badge.label}
            </span>
            <p className="mt-2 font-mono text-sm font-bold tracking-tight text-foreground">{hashId}</p>
            <p className="mt-1 text-xs text-foreground/65">{industryLabel(industry)}</p>
            <p className="mt-3 font-display text-lg font-extrabold tracking-tight text-foreground">{asking}</p>
            {modality ? <p className="mt-1 text-xs text-foreground/65">{modalityLabel(modality)}</p> : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-display text-lg font-extrabold tracking-tight text-foreground">
                {companyName || "Unnamed company"}
              </p>
              {place ? <p className="mt-0.5 text-sm text-foreground/55">{place}</p> : null}
            </div>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>

          <div className="mt-3">
            <p className="text-sm font-medium text-foreground">{sellerName}</p>
            <div className="mt-1 flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:gap-x-4">
              <a
                href={`mailto:${sellerEmail}`}
                className="inline-flex items-center gap-1.5 text-foreground/70 hover:text-brand-sky"
              >
                <Mail className="size-3.5 shrink-0" aria-hidden />
                {sellerEmail}
              </a>
              {district ? (
                <span className="inline-flex items-center gap-1.5 text-foreground/65">
                  <MapPin className="size-3.5 shrink-0" aria-hidden />
                  {district}
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
                <Link href={`/marketplace/${hashId}`} target="_blank">
                  Preview teaser
                </Link>
              </SmoothButton>
              {actions}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function SaleRequestDeskCard({
  listingId,
  hashId,
  companyName,
  industry,
  asking,
  district,
  sellerName,
  submittedAt,
}: {
  listingId: string;
  hashId: string;
  companyName?: string | null;
  industry: string;
  asking: string;
  district?: string | null;
  sellerName: string;
  submittedAt: string;
}) {
  return (
    <Card className="gap-0 overflow-hidden py-0 transition-colors hover:border-brand-sky/40">
      <CardHeader className="px-4 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-sky-muted text-brand-sky">
            <Building2 className="size-4" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <CardTitle className="truncate text-sm sm:text-base">{companyName || hashId}</CardTitle>
              <Badge variant="warning">New</Badge>
            </div>
            <CardDescription className="truncate">
              {sellerName}
              {submittedAt ? ` · ${submittedAt}` : ""}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 px-4 pb-3 text-xs text-muted-foreground">
        <p className="font-mono text-[11px] font-semibold tracking-tight text-foreground/70">{hashId}</p>
        <p className="flex items-center gap-1.5 truncate">
          <Building2 className="size-3 shrink-0 text-brand-sky" aria-hidden />
          {industryLabel(industry)} · {asking}
        </p>
        <p className="flex items-center gap-1.5 truncate">
          <MapPin className="size-3 shrink-0 text-brand-sky" aria-hidden />
          {district || "Location on file"}
        </p>
      </CardContent>
      <CardFooter className="border-t px-4 py-3">
        <Button asChild variant="sky" size="sm" className="w-full">
          <Link href={`/advisor/listings/${listingId}/edit`}>Review request</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

