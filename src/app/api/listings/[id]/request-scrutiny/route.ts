import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/analytics";
import { canAccessConfidentialListing, investorVerificationMessage } from "@/lib/investor-access";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required to request deep scrutiny." }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const allowed = await canAccessConfidentialListing(session.user.id, session.user.role, listing.ownerId);
  if (!allowed) {
    return NextResponse.json(
      { error: investorVerificationMessage(session.user.role) },
      { status: 403 }
    );
  }

  const existingNda = await prisma.ndaAgreement.findUnique({
    where: { buyerId_listingId: { buyerId: session.user.id, listingId: id } },
  });

  await logEvent({
    type: "request_scrutiny",
    sessionId: session.user.id,
    userId: session.user.id,
    entityType: "Listing",
    entityId: id,
  });

  return NextResponse.json({ ndaRequired: !existingNda });
}
