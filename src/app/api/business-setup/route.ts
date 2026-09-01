import { NextResponse } from "next/server";
import { submitBusinessSetup } from "@/lib/business-setup";
import { businessSetupIntakeSchema } from "@/lib/business-setup-intake";
import { logEvent } from "@/lib/analytics";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`business-setup:${ip}`, 8, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(rateLimitResponse(limited.retryAfter), { status: 429 });
  }

  const body = await req.json();
  const parsed = businessSetupIntakeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.website?.trim()) {
    return NextResponse.json({ ok: true });
  }

  const hasHeadOffice = parsed.data.addresses.some((a) => a.kind === "HEAD_OFFICE");
  if (!hasHeadOffice) {
    return NextResponse.json({ error: "Head office address is required" }, { status: 400 });
  }

  const { website: _honeypot, ...intake } = parsed.data;
  const result = await submitBusinessSetup(intake);

  if (!result.ok) {
    return NextResponse.json(
      {
        error: "This combination is not eligible under Nepal’s current rules.",
        blockers: result.blockers,
        warnings: result.warnings,
      },
      { status: 422 }
    );
  }

  await logEvent({
    type: "business_setup_completed",
    sessionId: ip,
    entityType: "BusinessSetup",
    entityId: result.setupId,
  });

  return NextResponse.json({
    ok: true,
    setupId: result.setupId,
    guide: result.guide,
  });
}
