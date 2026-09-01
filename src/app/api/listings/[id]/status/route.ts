import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { notifyUsers } from "@/lib/notifications";
import { compactDetails, sendOwnerListingDecisionEmail } from "@/lib/mail";
import { SAFE_USER_SELECT } from "@/lib/safe-user";

const statusSchema = z.object({
  status: z.enum(["PUBLISHED", "WITHDRAWN", "PENDING_REVIEW"]),
  reviewNotes: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "crm:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const listing = await prisma.listing.update({
    where: { id },
    data: {
      status: parsed.data.status,
      reviewNotes: parsed.data.reviewNotes,
    },
    include: { organization: true, owner: { select: SAFE_USER_SELECT } },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: `listing.status.${parsed.data.status}`,
      entity: "Listing",
      entityId: id,
      metadata: { reviewNotes: parsed.data.reviewNotes },
    },
  });

  if (parsed.data.status === "PUBLISHED") {
    await notifyUsers([listing.ownerId], {
      type: "listing.published",
      title: `${listing.hashId} is live on the marketplace`,
      body: "Buyers can now discover your anonymized listing.",
      href: `/marketplace/${listing.hashId}`,
      details: compactDetails({
        Reference: listing.hashId,
        Status: "Published",
        Seller: listing.owner.email,
        Company: listing.organization?.name,
        Sector: listing.industry.replace(/_/g, " "),
      }),
    }).catch((err) => console.error("[listings] failed to notify seller", err));

    if (listing.owner.email) {
      await sendOwnerListingDecisionEmail({
        to: listing.owner.email,
        name: listing.owner.name,
        hashId: listing.hashId,
        outcome: "published",
        href: `/marketplace/${listing.hashId}`,
      });
    }

    await prisma.crmTicket.updateMany({
      where: { listingId: id, source: "listing_review", status: "NEW" },
      data: { status: "WON", notes: `Listing ${listing.hashId} approved and published.` },
    });
  }

  if (parsed.data.status === "PENDING_REVIEW") {
    await notifyUsers([listing.ownerId], {
      type: "listing.withdrawn",
      title: `${listing.hashId} was taken offline`,
      body:
        parsed.data.reviewNotes ||
        "An advisor unpublished your listing. It is no longer visible to buyers.",
      href: "/dashboard",
      details: compactDetails({
        Reference: listing.hashId,
        Status: "Unpublished",
        Seller: listing.owner.email,
        Notes: parsed.data.reviewNotes,
      }),
    }).catch((err) => console.error("[listings] failed to notify seller", err));
  }

  if (parsed.data.status === "WITHDRAWN") {
    await notifyUsers([listing.ownerId], {
      type: "listing.withdrawn",
      title: `${listing.hashId} was not approved`,
      body: parsed.data.reviewNotes || "An advisor has withdrawn this listing from review.",
      href: "/dashboard",
      details: compactDetails({
        Reference: listing.hashId,
        Status: "Withdrawn",
        Seller: listing.owner.email,
        Notes: parsed.data.reviewNotes,
      }),
    }).catch((err) => console.error("[listings] failed to notify seller", err));

    if (listing.owner.email) {
      await sendOwnerListingDecisionEmail({
        to: listing.owner.email,
        name: listing.owner.name,
        hashId: listing.hashId,
        outcome: "rejected",
        notes: parsed.data.reviewNotes,
        href: "/dashboard",
      });
    }

    await prisma.crmTicket.updateMany({
      where: { listingId: id, source: "listing_review", status: "NEW" },
      data: { status: "LOST", notes: parsed.data.reviewNotes || `Listing ${listing.hashId} rejected.` },
    });
  }

  return NextResponse.json({ listing });
}
