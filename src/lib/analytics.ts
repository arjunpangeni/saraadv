import { prisma } from "@/lib/prisma";

/**
 * Product analytics funnel used across the platform, most importantly the
 * Buy/Sell monetization pipeline:
 *   listing_view -> request_scrutiny -> nda_signed -> unlock_request -> crm_ticket_created
 */
export type AnalyticsEventType =
  | "listing_view"
  | "listing_search"
  | "request_scrutiny"
  | "nda_signed"
  | "unlock_request"
  | "crm_ticket_created"
  | "teaser_downloaded"
  | "listing_dossier_downloaded"
  | "project_view"
  | "project_lead_submitted"
  | "project_lead_verified"
  | "project_nda_signed"
  | "project_dossier_downloaded"
  | "business_setup_started"
  | "business_setup_completed"
  | "business_setup_service_requested"
  | "carbon_project_created";

export interface LogEventInput {
  type: AnalyticsEventType;
  sessionId: string;
  userId?: string | null;
  entityType?: string;
  entityId?: string;
  path?: string;
  metadata?: Record<string, unknown>;
}

export async function logEvent(input: LogEventInput) {
  try {
    await prisma.event.create({
      data: {
        type: input.type,
        sessionId: input.sessionId,
        userId: input.userId ?? undefined,
        entityType: input.entityType,
        entityId: input.entityId,
        path: input.path,
        metadata: input.metadata as never,
      },
    });
  } catch (err) {
    // Analytics must never break the primary user flow.
    console.error("[analytics] failed to log event", err);
  }
}

export interface FunnelStageCount {
  stage: AnalyticsEventType;
  count: number;
}

export type AnalyticsRange = "7d" | "30d" | "all";

export function parseAnalyticsRange(raw?: string): AnalyticsRange {
  if (raw === "30d" || raw === "all") return raw;
  return "7d";
}

export function rangeToSinceDays(range: AnalyticsRange): number | undefined {
  if (range === "7d") return 7;
  if (range === "30d") return 30;
  return undefined;
}

export function rangeLabel(range: AnalyticsRange): string {
  if (range === "7d") return "Last 7 days";
  if (range === "30d") return "Last 30 days";
  return "All time";
}

/** Buy/Sell monetization funnel counts over a time window (default: all time). */
export async function getBuySellFunnel(sinceDays?: number): Promise<FunnelStageCount[]> {
  const stages: AnalyticsEventType[] = [
    "listing_view",
    "request_scrutiny",
    "nda_signed",
    "unlock_request",
    "crm_ticket_created",
  ];

  const since = sinceDays ? new Date(Date.now() - sinceDays * 86_400_000) : undefined;

  const counts = await Promise.all(
    stages.map((stage) =>
      prisma.event.count({
        where: { type: stage, ...(since ? { createdAt: { gte: since } } : {}) },
      })
    )
  );

  return stages.map((stage, i) => ({ stage, count: counts[i] }));
}

/** Project Bank funnel: discovery -> lead. Vetting and NDA happen offline. */
export async function getProjectBankFunnel(sinceDays?: number): Promise<FunnelStageCount[]> {
  const stages: AnalyticsEventType[] = [
    "project_view",
    "project_lead_submitted",
    "project_lead_verified",
  ];

  const since = sinceDays ? new Date(Date.now() - sinceDays * 86_400_000) : undefined;

  const counts = await Promise.all(
    stages.map((stage) =>
      prisma.event.count({
        where: { type: stage, ...(since ? { createdAt: { gte: since } } : {}) },
      })
    )
  );

  return stages.map((stage, i) => ({ stage, count: counts[i] }));
}
