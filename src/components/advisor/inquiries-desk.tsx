import Link from "next/link";
import { FilterTabs } from "@/components/console/filter-tabs";
import {
  isServiceInquiryType,
  SERVICE_INQUIRY_TAB_LABELS,
  SERVICE_INQUIRY_TYPES,
  type ServiceInquiryTopic,
} from "@/lib/service-inquiries";
import { cn } from "@/lib/utils";

export type InquiryStatusFilter = "NEW" | "CONTACTED" | "CLOSED";

const STATUS_TABS: { id: InquiryStatusFilter | undefined; label: string }[] = [
  { id: undefined, label: "All" },
  { id: "NEW", label: "New" },
  { id: "CONTACTED", label: "Contacted" },
  { id: "CLOSED", label: "Closed" },
];

export function parseInquiryStatus(raw?: string): InquiryStatusFilter | undefined {
  if (raw === "NEW" || raw === "CONTACTED" || raw === "CLOSED") return raw;
  return undefined;
}

export function parseInquiryType(raw?: string): ServiceInquiryTopic | undefined {
  return isServiceInquiryType(raw) ? raw : undefined;
}

export function inquiriesHref({
  type,
  status,
  q,
}: {
  type?: ServiceInquiryTopic;
  status?: InquiryStatusFilter;
  q?: string;
}) {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (status) params.set("status", status);
  const query = q?.trim();
  if (query) params.set("q", query);
  const qs = params.toString();
  return qs ? `/advisor/inquiries?${qs}` : "/advisor/inquiries";
}

export function InquiryTypeTabs({
  type,
  status,
  q,
  counts,
  className,
}: {
  type?: ServiceInquiryTopic;
  status?: InquiryStatusFilter;
  q?: string;
  counts: { all: number } & Partial<Record<ServiceInquiryTopic, number>>;
  className?: string;
}) {
  const tabs: { id?: ServiceInquiryTopic; label: string; count: number }[] = [
    { label: "All", count: counts.all },
    ...SERVICE_INQUIRY_TYPES.map((value) => ({
      id: value,
      label: SERVICE_INQUIRY_TAB_LABELS[value],
      count: counts[value] ?? 0,
    })),
  ];

  return (
    <div className={cn("border-b border-border", className)} role="tablist" aria-label="Inquiry type">
      <div className="flex flex-wrap gap-x-1">
        {tabs.map((tab) => {
          const selected = tab.id ? type === tab.id : !type;
          return (
            <Link
              key={tab.id ?? "all"}
              href={inquiriesHref({ type: tab.id, status, q })}
              role="tab"
              aria-selected={selected}
              className={cn(
                "-mb-px inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 text-base font-display font-extrabold tracking-tight whitespace-nowrap transition-colors sm:px-4",
                selected
                  ? "border-brand-sky text-foreground"
                  : "border-transparent text-foreground/45 hover:text-foreground/75"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "ml-2 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
                  selected ? "bg-brand-sky-muted text-brand-sky" : "bg-muted text-foreground/50"
                )}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function InquiryStatusTabs({
  type,
  status,
  q,
  counts,
  className,
}: {
  type?: ServiceInquiryTopic;
  status?: InquiryStatusFilter;
  q?: string;
  counts: { all: number } & Partial<Record<InquiryStatusFilter, number>>;
  className?: string;
}) {
  return (
    <FilterTabs
      className={className}
      wrap
      items={STATUS_TABS.map((item) => ({
        href: inquiriesHref({ type, status: item.id, q }),
        label: `${item.label} (${item.id ? (counts[item.id] ?? 0) : counts.all})`,
        active: item.id ? status === item.id : !status,
      }))}
    />
  );
}
