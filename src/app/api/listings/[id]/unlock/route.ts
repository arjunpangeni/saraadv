import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/analytics";
import { canAccessConfidentialListing, investorVerificationMessage } from "@/lib/investor-access";

const unlockSchema = z.object({
  servicesSelected: z.array(
    z.enum([
      "DUE_DILIGENCE_AUDIT",
      "LEGAL_STRUCTURING",
      "TAX_OPTIMIZATION",
      "POST_ACQUISITION_INTEGRATION",
    ])
  ),
  advisoryOptOut: z.boolean().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
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

  const body = await req.json();
  const parsed = unlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.servicesSelected.length === 0 && !parsed.data.advisoryOptOut) {
    return NextResponse.json(
      { error: "Select at least one advisory service, or confirm you do not require SARA services." },
      { status: 400 }
    );
  }

  const nda = await prisma.ndaAgreement.findUnique({
    where: { buyerId_listingId: { buyerId: session.user.id, listingId: id } },
  });
  if (!nda) {
    return NextResponse.json({ error: "A signed NDA is required before requesting the full profile." }, { status: 403 });
  }

  const unlockRequest = await prisma.unlockRequest.create({
    data: { buyerId: session.user.id, listingId: id, servicesSelected: parsed.data.servicesSelected },
  });

  const priority = parsed.data.servicesSelected.length > 0 ? "HIGH" : "MEDIUM";
  const ticket = await prisma.crmTicket.create({
    data: {
      buyerId: session.user.id,
      listingId: id,
      source: "buysell_unlock",
      priority,
      notes: `Requested services: ${parsed.data.servicesSelected.join(", ") || "none (opt-out)"} for listing ${listing.hashId}.`,
    },
  });

  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "listing.unlock_request", entity: "Listing", entityId: id },
  });

  await logEvent({
    type: "unlock_request",
    sessionId: session.user.id,
    userId: session.user.id,
    entityType: "Listing",
    entityId: id,
    metadata: { servicesSelected: parsed.data.servicesSelected },
  });
  await logEvent({
    type: "crm_ticket_created",
    sessionId: session.user.id,
    userId: session.user.id,
    entityType: "CrmTicket",
    entityId: ticket.id,
  });

  return NextResponse.json({ unlockRequestId: unlockRequest.id, crmTicketId: ticket.id }, { status: 201 });
}
