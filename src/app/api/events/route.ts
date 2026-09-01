import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { logEvent, type AnalyticsEventType } from "@/lib/analytics";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const EVENT_TYPES: AnalyticsEventType[] = [
  "listing_view",
  "listing_search",
  "request_scrutiny",
  "nda_signed",
  "unlock_request",
  "crm_ticket_created",
  "teaser_downloaded",
  "project_view",
  "project_lead_submitted",
  "project_lead_verified",
  "project_nda_signed",
  "project_dossier_downloaded",
  "business_setup_started",
  "business_setup_completed",
  "business_setup_service_requested",
  "carbon_project_created",
];

const eventSchema = z.object({
  type: z.enum(EVENT_TYPES as [AnalyticsEventType, ...AnalyticsEventType[]]),
  sessionId: z.string().min(1).max(80),
  entityType: z.string().max(64).optional(),
  entityId: z.string().max(80).optional(),
  path: z.string().max(300).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  const limited = rateLimit(`events:${clientIp(req)}`, 60, 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(rateLimitResponse(limited.retryAfter), { status: 429 });
  }

  const session = await auth();
  const body = await req.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  let metadata = parsed.data.metadata;
  if (metadata && JSON.stringify(metadata).length > 2000) {
    metadata = undefined;
  }

  await logEvent({
    type: parsed.data.type,
    sessionId: parsed.data.sessionId,
    entityType: parsed.data.entityType,
    entityId: parsed.data.entityId,
    path: parsed.data.path,
    metadata,
    userId: session?.user?.id,
  });

  return NextResponse.json({ ok: true });
}
