import { NextResponse } from "next/server";
import { previewSetupGuide } from "@/lib/business-setup";
import { businessSetupIntakeSchema } from "@/lib/business-setup-intake";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const limited = rateLimit(`business-preview:${clientIp(req)}`, 30, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(rateLimitResponse(limited.retryAfter), { status: 429 });
  }

  const body = await req.json();
  const parsed = businessSetupIntakeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { website: _honeypot, ...intake } = parsed.data;
  const preview = await previewSetupGuide(intake);
  const blockers = preview.issues.filter((i) => i.severity === "BLOCKER");
  const warnings = preview.issues.filter((i) => i.severity === "WARNING");

  return NextResponse.json({
    ok: blockers.length === 0,
    screeningLevel: preview.screeningLevel,
    issues: preview.issues,
    blockers,
    warnings,
    required: preview.required,
    recommended: preview.recommended,
  });
}
