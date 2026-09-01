import { NextResponse } from "next/server";
import { z } from "zod";
import { DealDeskStatus } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { notifyUsers } from "@/lib/notifications";
import { sendInvestorNoticeEmail } from "@/lib/mail";

const updateSchema = z.object({
  status: z.nativeEnum(DealDeskStatus).optional(),
  adminNotes: z.string().max(4000).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "crm:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const previous = await prisma.listingLead.findUnique({
    where: { id },
    include: { listing: { select: { id: true, hashId: true, industry: true } } },
  });
  if (!previous) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  if (parsed.data.status && parsed.data.status !== "NEW" && parsed.data.status !== "REJECTED" && !previous.isEmailVerified) {
    return NextResponse.json(
      { error: "Verify the buyer email before advancing this lead." },
      { status: 400 }
    );
  }

  const lead = await prisma.listingLead.update({
    where: { id },
    data: {
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.adminNotes !== undefined ? { adminNotes: parsed.data.adminNotes } : {}),
      ...(parsed.data.status === "NDA_SIGNED" ? { ndaSignedAt: new Date() } : {}),
    },
    include: { listing: { select: { hashId: true } } },
  });

  if (
    parsed.data.status === "UNDER_VETTING" &&
    previous.status !== "UNDER_VETTING" &&
    previous.isEmailVerified
  ) {
    const listingUrl = `/marketplace/${lead.listing.hashId}`;
    if (lead.buyerId) {
      await notifyUsers([lead.buyerId], {
        type: "listing.lead_vetted",
        title: `Your inquiry for ${lead.listing.hashId} is under review`,
        body: "The SARA deal desk will contact you to arrange the NDA.",
        href: listingUrl,
        emailAdmin: false,
      }).catch((err) => console.error("[marketplace] failed to notify buyer on vet", err));
    }
    await sendInvestorNoticeEmail({
      to: lead.email,
      name: lead.name,
      subject: `SARA Advisors: your inquiry for ${lead.listing.hashId} is under review`,
      body: "Our deal desk has reviewed your profile request and will be in touch to arrange the NDA.",
      href: listingUrl,
    });
  }

  return NextResponse.json({ lead });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "crm:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const lead = await prisma.listingLead.findUnique({
    where: { id },
    select: { id: true, email: true, listingId: true, name: true },
  });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.crmTicket.deleteMany({
      where: { source: "buysell_unlock", listingId: lead.listingId, contactEmail: lead.email },
    }),
    prisma.listingLead.delete({ where: { id } }),
  ]);

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "listing_lead.delete",
      entity: "ListingLead",
      entityId: id,
      metadata: { email: lead.email, name: lead.name },
    },
  });

  return NextResponse.json({ ok: true });
}
