import Link from "next/link";
import type { DealDeskStatus } from "@/generated/prisma";
import { FilterTabs } from "@/components/console/filter-tabs";
import { cn } from "@/lib/utils";

export type CrmTab = "buyers" | "investors";
export type CrmView = "action" | "progress" | "released" | "rejected";

const TABS: { id: CrmTab; label: string }[] = [
  { id: "buyers", label: "Buyer leads" },
  { id: "investors", label: "Investor leads" },
];

const VIEWS: { id: CrmView; label: string }[] = [
  { id: "action", label: "Needs action" },
  { id: "progress", label: "In progress" },
  { id: "released", label: "Released" },
  { id: "rejected", label: "Rejected" },
];

export function parseCrmTab(raw?: string): CrmTab {
  if (raw === "project" || raw === "investors") return "investors";
  return "buyers";
}

export function parseCrmView(raw?: string): CrmView {
  if (raw === "progress" || raw === "released" || raw === "rejected") return raw;
  return "action";
}

export function crmViewStatuses(view: CrmView): DealDeskStatus[] {
  if (view === "progress") return ["NDA_SENT", "NDA_SIGNED"];
  if (view === "released") return ["DOSSIER_RELEASED"];
  if (view === "rejected") return ["REJECTED"];
  return ["NEW", "UNDER_VETTING"];
}

export function crmHref({
  tab,
  view,
  q,
}: {
  tab?: CrmTab;
  view?: CrmView;
  q?: string;
}) {
  const params = new URLSearchParams();
  if (tab === "investors") params.set("tab", "investors");
  if (view && view !== "action") params.set("view", view);
  const query = q?.trim();
  if (query) params.set("q", query);
  const qs = params.toString();
  return qs ? `/advisor/crm?${qs}` : "/advisor/crm";
}

export function CrmFilterTabs({
  active,
  view,
  q,
  counts,
  className,
}: {
  active: CrmTab;
  view?: CrmView;
  q?: string;
  counts?: Partial<Record<CrmTab, number>>;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-border", className)} role="tablist" aria-label="Lead type">
      <div className="flex flex-wrap gap-x-1">
        {TABS.map((tab) => {
          const selected = active === tab.id;
          return (
            <Link
              key={tab.id}
              href={crmHref({ tab: tab.id, view, q })}
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
              {counts?.[tab.id] != null ? (
                <span
                  className={cn(
                    "ml-2 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
                    selected ? "bg-brand-sky-muted text-brand-sky" : "bg-muted text-foreground/50"
                  )}
                >
                  {counts[tab.id]}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function CrmViewTabs({
  tab,
  active,
  q,
  counts,
  className,
}: {
  tab: CrmTab;
  active: CrmView;
  q?: string;
  counts?: Partial<Record<CrmView, number>>;
  className?: string;
}) {
  return (
    <FilterTabs
      className={cn(className)}
      items={VIEWS.map((item) => ({
        href: crmHref({ tab, view: item.id, q }),
        label: counts?.[item.id] != null ? `${item.label} (${counts[item.id]})` : item.label,
        active: active === item.id,
      }))}
    />
  );
}
