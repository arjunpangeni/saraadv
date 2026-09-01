import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { consumeListingLeadMagicLink } from "@/lib/listing-magic-link";
import { setListingLeadSessionCookie } from "@/lib/listing-lead-session";

const schema = z.object({
  token: z.string().min(16).max(200),
});

export async function POST(req: Request) {
  const limited = rateLimit(`listing-lead-verify:${clientIp(req)}`, 20, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(rateLimitResponse(limited.retryAfter), { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "This link is not valid." }, { status: 400 });
  }

  const result = await consumeListingLeadMagicLink(parsed.data.token);
  if (result.ok) {
    await setListingLeadSessionCookie({ email: result.email, name: result.name });
    return NextResponse.json({
      ok: true,
      alreadyVerified: Boolean(result.alreadyVerified),
      hashId: result.hashId,
    });
  }

  if (result.reason === "expired") {
    return NextResponse.json({ error: "expired", hashId: result.hashId ?? null }, { status: 410 });
  }

  return NextResponse.json({ error: "invalid" }, { status: 400 });
}
