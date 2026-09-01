import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { listingWizardSchema, listingValidationErrors } from "@/types/listing";
import { createListing, getPublicListings, parseMarketplaceSort } from "@/lib/listings";
import type { DealValueBand } from "@/lib/calc";
import { isOwnedObjectKey } from "@/lib/file-type";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "listing:create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limited = rateLimit(`listing-create:${session.user.id}`, 10, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(rateLimitResponse(limited.retryAfter), { status: 429 });
  }

  const body = await req.json();
  const parsed = listingWizardSchema.safeParse(body);
  if (!parsed.success) {
    const { summary } = listingValidationErrors(parsed.error);
    return NextResponse.json({ error: summary[0] || "Please review the form.", details: summary }, { status: 400 });
  }

  const stolenKey = parsed.data.documentKeys?.some(
    (d) => !isOwnedObjectKey(d.key, session.user.id, "listings/")
  );
  if (stolenKey) {
    return NextResponse.json({ error: "Invalid document upload." }, { status: 400 });
  }

  const listing = await createListing(session.user.id, parsed.data);
  return NextResponse.json({ id: listing.id, hashId: listing.hashId }, { status: 201 });
}

export async function GET(req: Request) {
  const limited = rateLimit(`listings-get:${clientIp(req)}`, 60, 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(rateLimitResponse(limited.retryAfter), { status: 429 });
  }
  const { searchParams } = new URL(req.url);
  const listings = await getPublicListings({
    industry: searchParams.get("industry") || undefined,
    dealValueBand: (searchParams.get("dealValueBand") as DealValueBand | null) || undefined,
    positiveEbitdaOnly: searchParams.get("positiveEbitdaOnly") === "true",
    province: searchParams.get("province") || undefined,
    district: searchParams.get("district") || undefined,
    minRevenueNpr: searchParams.get("minRevenueNpr")
      ? Number(searchParams.get("minRevenueNpr"))
      : undefined,
    query: searchParams.get("q") || undefined,
    sort: parseMarketplaceSort(searchParams.get("sort") || undefined),
  });

  return NextResponse.json({ listings });
}
