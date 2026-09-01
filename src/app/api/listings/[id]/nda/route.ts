import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateNdaPdf } from "@/lib/nda-pdf";
import { uploadObject } from "@/lib/storage";
import { logEvent } from "@/lib/analytics";
import { canAccessConfidentialListing, investorVerificationMessage } from "@/lib/investor-access";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.ownerId === session.user.id) {
    return NextResponse.json({ error: "You already have access to your own listing." }, { status: 400 });
  }

  const allowed = await canAccessConfidentialListing(session.user.id, session.user.role, listing.ownerId);
  if (!allowed) {
    return NextResponse.json(
      { error: investorVerificationMessage(session.user.role) },
      { status: 403 }
    );
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? null;

  const pdfBytes = await generateNdaPdf({
    referenceId: listing.hashId,
    referenceLabel: "Listing reference",
    buyerName: session.user.name || session.user.email || "Investor",
    buyerEmail: session.user.email || "",
    signedAt: new Date(),
    ipAddress: ip,
  });
  const docKey = `ndas/${listing.hashId}/${session.user.id}-${Date.now()}.pdf`;
  await uploadObject(docKey, Buffer.from(pdfBytes), "application/pdf");

  const nda = await prisma.ndaAgreement.upsert({
    where: { buyerId_listingId: { buyerId: session.user.id, listingId: id } },
    update: { documentS3Key: docKey },
    create: { buyerId: session.user.id, listingId: id, ipAddress: ip, documentS3Key: docKey },
  });

  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "nda.sign", entity: "Listing", entityId: id },
  });

  await logEvent({
    type: "nda_signed",
    sessionId: session.user.id,
    userId: session.user.id,
    entityType: "Listing",
    entityId: id,
  });

  return NextResponse.json({ signedAt: nda.signedAt });
}
