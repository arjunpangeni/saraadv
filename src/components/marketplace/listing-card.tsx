import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Cpu,
  Factory,
  HardHat,
  HeartPulse,
  Hotel,
  Lock,
  MapPin,
  Radio,
  ShoppingBag,
  Store,
  TrendingUp,
  Wheat,
  Zap,
} from "lucide-react";
import { formatNprCompact, type DealValueBand } from "@/lib/calc";
import { industryLabel, legalStructureLabel, modalityLabel } from "@/types/listing";
import type { PublicListingSummary } from "@/lib/listings";

const INDUSTRY_ICON: Record<string, typeof Building2> = {
  HYDROPOWER: Zap,
  MANUFACTURING: Factory,
  FMCG: ShoppingBag,
  IT: Cpu,
  HOSPITALITY: Hotel,
  RETAIL: Store,
  HEALTHCARE: HeartPulse,
  CONSTRUCTION: HardHat,
  TELECOM: Radio,
  AGRICULTURE: Wheat,
  OTHER: Building2,
};

const DEAL_BAND_SHORT: Record<DealValueBand, string> = {
  UNDER_1_CRORE: "Under 1 Cr",
  "1_TO_5_CRORE": "1–5 Cr",
  "5_TO_10_CRORE": "5–10 Cr",
  ABOVE_10_CRORE: "Above 10 Cr",
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-muted/70 px-2 py-2">
      <dt className="text-[10px] font-medium tracking-wide text-foreground/50 uppercase">{label}</dt>
      <dd className="heading-soft mt-0.5 break-words font-heading text-xs font-semibold tracking-[-0.015em] text-foreground sm:text-sm">
        {value}
      </dd>
    </div>
  );
}

export function ListingCard({ listing }: { listing: PublicListingSummary; priority?: boolean }) {
  const ebitdaPositive = (listing.latestEbitda ?? 0) > 0;
  const place = [listing.district, listing.province].filter(Boolean).join(", ") || "Nepal";
  const asking = listing.askingPriceNpr ? formatNprCompact(listing.askingPriceNpr) : "On request";
  const turnover = listing.largestTurnover
    ? formatNprCompact(listing.largestTurnover)
    : listing.latestRevenue
      ? formatNprCompact(listing.latestRevenue)
      : null;
  const turnoverLabel = listing.largestTurnover ? "Turnover" : "Revenue";
  const assets = listing.totalAssets ? formatNprCompact(listing.totalAssets) : null;
  const capacity = listing.licensedCapacity;
  const Icon = INDUSTRY_ICON[listing.industry] ?? Building2;
  const sector = industryLabel(listing.industry);
  const structure = legalStructureLabel(listing.legalStructure);
  const modality = listing.modality ? modalityLabel(listing.modality) : null;
  const meta = [place, listing.establishedYear ? `Est. ${listing.establishedYear}` : null, structure !== "—" ? structure : null]
    .filter(Boolean)
    .join(" · ");
  const metrics = [
    turnover ? { label: turnoverLabel, value: turnover } : null,
    assets ? { label: "Assets", value: assets } : null,
    capacity ? { label: "Capacity", value: capacity } : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row));

  return (
    <article className="group h-full">
      <Link
        href={`/marketplace/${listing.hashId}`}
        className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-card-hover)]"
      >
        <div className="flex items-center justify-between gap-2 bg-tz-green px-4 py-3">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-tz-green-deep">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-card/80">
              <Icon className="size-3.5" aria-hidden />
            </span>
            <span className="truncate">{sector}</span>
          </span>
          {listing.dealValueBand ? (
            <span className="shrink-0 rounded-md bg-card/80 px-2 py-0.5 text-[11px] font-semibold text-foreground/70">
              {DEAL_BAND_SHORT[listing.dealValueBand]}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="heading-soft break-all font-heading font-mono text-lg font-semibold tracking-[-0.015em] text-foreground group-hover:text-tz-blue-deep sm:text-xl">
            {listing.hashId}
          </h3>
          <p className="heading-soft mt-2 font-heading text-2xl font-semibold tracking-[-0.015em] text-foreground">{asking}</p>
          <p className="text-[10px] font-medium tracking-wide text-foreground/45 uppercase">Proposed sale value</p>

          {(modality || ebitdaPositive) && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {modality ? (
                <span className="rounded-md bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-foreground/70">
                  {modality}
                </span>
              ) : null}
              {ebitdaPositive ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-success-bg px-2 py-0.5 text-[11px] font-semibold text-success-fg">
                  <TrendingUp className="size-3" aria-hidden />
                  Positive EBITDA
                </span>
              ) : null}
            </div>
          )}

          <p className="mt-2 flex items-center gap-1 text-xs text-foreground/55">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{meta}</span>
          </p>

          {metrics.length > 0 ? (
            <dl
              className={
                metrics.length === 1
                  ? "mt-3 grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-border"
                  : metrics.length === 2
                    ? "mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border"
                    : "mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-border"
              }
            >
              {metrics.map((metric) => (
                <Metric key={metric.label} label={metric.label} value={metric.value} />
              ))}
            </dl>
          ) : null}

          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/45">
              <Lock className="size-3" aria-hidden />
              Identity gated until NDA
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
