import { NextResponse } from "next/server";
import { getPublicListings } from "@/lib/listings";
import { aiSearchEnabled } from "@/lib/ai-search";
import { logEvent } from "@/lib/analytics";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

/** AI-powered marketplace search endpoint (semantic when OPENAI_API_KEY is set, keyword fallback otherwise). */
export async function GET(req: Request) {
  const limited = rateLimit(`search:${clientIp(req)}`, 30, 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(rateLimitResponse(limited.retryAfter), { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").slice(0, 200);
  const sessionId = (searchParams.get("sessionId") || "anonymous").slice(0, 80);

  const listings = await getPublicListings({ query: q });

  await logEvent({
    type: "listing_search",
    sessionId,
    metadata: { query: q, resultCount: listings.length },
  });

  return NextResponse.json({ listings, aiEnabled: aiSearchEnabled(), query: q });
}
