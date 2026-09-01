import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { consumeProjectLeadMagicLink } from "@/lib/project-bank-magic-link";

const schema = z.object({
  token: z.string().min(16).max(200),
});

export async function POST(req: Request) {
  const limited = rateLimit(`project-lead-verify:${clientIp(req)}`, 20, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(rateLimitResponse(limited.retryAfter), { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "This link is not valid." }, { status: 400 });
  }

  const result = await consumeProjectLeadMagicLink(parsed.data.token);
  if (result.ok) {
    return NextResponse.json({
      ok: true,
      alreadyVerified: Boolean(result.alreadyVerified),
      projectSlug: result.projectSlug,
      projectTitle: result.projectTitle,
    });
  }

  if (result.reason === "expired") {
    return NextResponse.json(
      { error: "expired", projectSlug: result.projectSlug ?? null },
      { status: 410 }
    );
  }

  return NextResponse.json({ error: "invalid" }, { status: 400 });
}
