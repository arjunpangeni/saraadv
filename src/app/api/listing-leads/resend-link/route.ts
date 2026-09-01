import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { findListingLeadForResend, issueListingLeadMagicLink, maskEmail } from "@/lib/listing-magic-link";

const schema = z.object({
  email: z.string().email(),
  listingId: z.string().min(1),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`listing-lead-resend:${ip}`, 3, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many resend attempts. Please wait and try again.", retryAfter: limited.retryAfter },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const emailLimited = rateLimit(`listing-lead-resend-email:${email}`, 3, 60 * 60 * 1000);
  if (!emailLimited.ok) {
    return NextResponse.json(
      {
        error: "Too many confirmation emails to this address. Try again later.",
        retryAfter: emailLimited.retryAfter,
      },
      { status: 429 }
    );
  }

  const listing = await prisma.listing.findFirst({
    where: { OR: [{ id: parsed.data.listingId }, { hashId: parsed.data.listingId }], status: "PUBLISHED" },
    select: { id: true, hashId: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const lead = await findListingLeadForResend(listing.id, email);
  if (!lead) {
    return NextResponse.json({ error: "No pending request for this email." }, { status: 404 });
  }
  if (lead.isEmailVerified) {
    return NextResponse.json({ alreadyVerified: true, email: maskEmail(email), hashId: listing.hashId });
  }

  const issued = await issueListingLeadMagicLink({
    leadId: lead.id,
    email,
    name: lead.name,
    hashId: listing.hashId,
  });
  if (!issued.ok) {
    return NextResponse.json({ error: issued.error, retryAfter: issued.retryAfter }, { status: 429 });
  }

  return NextResponse.json({
    ok: true,
    email: maskEmail(email),
    hashId: listing.hashId,
    retryAfter: issued.retryAfter,
  });
}
