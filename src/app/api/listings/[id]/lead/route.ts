import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/analytics";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { leadInquirySchema } from "@/lib/project-bank-schemas";
import { issueListingLeadMagicLink, maskEmail } from "@/lib/listing-magic-link";
import { setListingLeadSessionCookie } from "@/lib/listing-lead-session";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(`listing-lead:${clientIp(req)}`, 8, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(rateLimitResponse(limited.retryAfter), { status: 429 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = leadInquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." },
      { status: 400 }
    );
  }

  const session = await auth();
  const listing = await prisma.listing.findFirst({
    where: { OR: [{ id }, { hashId: id }], status: "PUBLISHED" },
    select: { id: true, hashId: true, status: true },
  });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const email = parsed.data.email.toLowerCase().trim();
  const existingUser = await prisma.user.findUnique({ where: { email } });
  const buyerId = existingUser?.id;

  const existingLead = await prisma.listingLead.findUnique({
    where: { listingId_email: { listingId: listing.id, email } },
  });

  if (existingLead?.isEmailVerified) {
    await setListingLeadSessionCookie({ email, name: existingLead.name });
    return NextResponse.json({
      alreadyVerified: true,
      email: maskEmail(email),
      hashId: listing.hashId,
    });
  }

  const lead =
    existingLead ??
    (await prisma.listingLead.create({
      data: {
        listingId: listing.id,
        buyerId,
        name: parsed.data.name,
        firm: parsed.data.firm,
        email,
        phone: parsed.data.phone,
        investorType: parsed.data.investorType,
        investmentTimeframe: parsed.data.investmentTimeframe,
      },
    }));

  if (existingLead) {
    await prisma.listingLead.update({
      where: { id: existingLead.id },
      data: {
        name: parsed.data.name,
        firm: parsed.data.firm,
        phone: parsed.data.phone,
        investorType: parsed.data.investorType,
        investmentTimeframe: parsed.data.investmentTimeframe,
        buyerId: buyerId ?? existingLead.buyerId,
      },
    });
  }

  const issued = await issueListingLeadMagicLink({
    leadId: lead.id,
    email,
    name: parsed.data.name,
    hashId: listing.hashId,
  });
  if (!issued.ok) {
    return NextResponse.json({ error: issued.error, retryAfter: issued.retryAfter }, { status: 429 });
  }

  await logEvent({
    type: "listing_lead_submitted",
    sessionId: session?.user?.id ?? lead.id,
    userId: buyerId,
    entityType: "Listing",
    entityId: listing.id,
    metadata: { email, firm: parsed.data.firm, phone: parsed.data.phone },
  });

  return NextResponse.json(
    {
      leadId: lead.id,
      email: maskEmail(email),
      hashId: listing.hashId,
      alreadySubmitted: Boolean(existingLead),
    },
    { status: existingLead ? 200 : 201 }
  );
}
