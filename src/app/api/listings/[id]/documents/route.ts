import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasNdaAccess, canViewFullListing, logDataRoomAccess } from "@/lib/listings";
import { getSignedDownloadUrl } from "@/lib/storage";
import { isVerifiedInvestor, investorVerificationMessage } from "@/lib/investor-access";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { documents: true },
  });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = session.user.id === listing.ownerId;
  const hasNda = await hasNdaAccess(session.user.id, listing.id);
  const verified = await isVerifiedInvestor(session.user.id, session.user.role);
  const canView = canViewFullListing(session.user.role, isOwner, hasNda, verified);

  if (!canView) {
    if (!isOwner && !verified) {
      return NextResponse.json({ error: investorVerificationMessage(session.user.role) }, { status: 403 });
    }
    return NextResponse.json({ error: "NDA required to access documents" }, { status: 403 });
  }

  await logDataRoomAccess(session.user.id, id, "listing.documents.view");

  const documents = await Promise.all(
    listing.documents.map(async (d) => ({
      id: d.id,
      type: d.type,
      url: await getSignedDownloadUrl(d.s3Key, 300),
      createdAt: d.createdAt,
    }))
  );

  return NextResponse.json({ documents });
}
