import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { FunnelStageCount } from "@/lib/analytics";

const DEFAULT_STAGE_LABELS: Record<string, string> = {
  listing_view: "Listing views",
  request_scrutiny: "Requested scrutiny",
  nda_signed: "NDAs signed",
  unlock_request: "Unlock requests",
  crm_ticket_created: "CRM tickets",
  project_view: "Project views",
  project_lead_submitted: "Dossier requests",
  project_lead_verified: "Emails verified",
  project_nda_signed: "Project NDAs signed",
  project_dossier_downloaded: "Dossiers downloaded",
};

export function FunnelChart({
  data,
  stageLabels = DEFAULT_STAGE_LABELS,
}: {
  data: FunnelStageCount[];
  stageLabels?: Record<string, string>;
}) {
  const rows = data.map((d) => ({
    key: d.stage,
    name: stageLabels[d.stage] ?? d.stage,
    count: d.count,
  }));
  const max = Math.max(...rows.map((row) => row.count), 0);
  const empty = rows.every((row) => row.count === 0);

  if (empty) {
    return (
      <EmptyState
        compact
        icon={BarChart3}
        title="No events in this range"
        description="Counts appear here once visitors move through this funnel."
        className="border-dashed shadow-none"
      />
    );
  }

  return (
    <ol className="space-y-3">
      {rows.map((row, index) => {
        const previous = index === 0 ? null : rows[index - 1].count;
        const kept =
          previous != null && previous > 0 ? Math.round((row.count / previous) * 100) : null;
        const width = max > 0 ? Math.max((row.count / max) * 100, row.count > 0 ? 4 : 0) : 0;

        return (
          <li key={row.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-foreground">{row.name}</span>
              <span className="shrink-0 text-sm tabular-nums text-foreground/70">
                {row.count.toLocaleString()}
                {kept != null ? (
                  <span className="ml-2 text-xs text-foreground/45">{kept}% of previous</span>
                ) : null}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand-sky"
                style={{ width: `${width}%` }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
