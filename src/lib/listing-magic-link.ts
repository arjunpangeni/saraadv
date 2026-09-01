import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { compactDetails, sendListingMagicLinkEmail } from "@/lib/mail";
import { notifyRoles } from "@/lib/notifications";
import { logEvent } from "@/lib/analytics";
import { hashMagicToken, maskEmail } from "@/lib/project-bank-magic-link";

export { maskEmail };

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 2 * 60 * 1000;
const MAX_LINKS_PER_DAY = 3;

export const LISTING_MAGIC_LINK_RESEND_COOLDOWN_SEC = RESEND_COOLDOWN_MS / 1000;

export async function issueListingLeadMagicLink(opts: {
  leadId: string;
  email: string;
  name: string;
  hashId: string;
}) {
  const dayAgo = new Date(Date.now() - TOKEN_TTL_MS);
  const [issuedToday, latest] = await Promise.all([
    prisma.listingLeadMagicLink.count({
      where: { leadId: opts.leadId, createdAt: { gte: dayAgo } },
    }),
    prisma.listingLeadMagicLink.findFirst({
      where: { leadId: opts.leadId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - latest.createdAt.getTime())) / 1000);
    return { ok: false as const, error: `Wait ${wait}s before requesting a new link.`, retryAfter: wait };
  }

  if (issuedToday >= MAX_LINKS_PER_DAY) {
    const oldestToday = await prisma.listingLeadMagicLink.findFirst({
      where: { leadId: opts.leadId, createdAt: { gte: dayAgo } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    const wait = oldestToday
      ? Math.max(1, Math.ceil((oldestToday.createdAt.getTime() + TOKEN_TTL_MS - Date.now()) / 1000))
      : 60 * 60;
    return {
      ok: false as const,
      error: "You can request up to 3 confirmation emails per day for this listing.",
      retryAfter: wait,
    };
  }

  await prisma.listingLeadMagicLink.updateMany({
    where: { leadId: opts.leadId, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const token = randomBytes(32).toString("base64url");
  await prisma.listingLeadMagicLink.create({
    data: {
      leadId: opts.leadId,
      tokenHash: hashMagicToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const sent = await sendListingMagicLinkEmail({
    to: opts.email,
    name: opts.name,
    hashId: opts.hashId,
    verifyHref: `/marketplace/verify?token=${encodeURIComponent(token)}`,
  });

  if (sent.skipped) {
    console.info(`[marketplace] magic link email skipped for ${opts.email} — configure Resend`);
    if (process.env.NODE_ENV !== "production") {
      console.info(`[marketplace] magic link: /marketplace/verify?token=${token}`);
    }
  }

  return { ok: true as const, skipped: sent.skipped, retryAfter: LISTING_MAGIC_LINK_RESEND_COOLDOWN_SEC };
}

export type ConsumeListingMagicLinkResult =
  | { ok: true; leadId: string; hashId: string; email: string; name: string; alreadyVerified?: boolean }
  | { ok: false; reason: "invalid" | "expired"; hashId?: string };

export async function consumeListingLeadMagicLink(token: string): Promise<ConsumeListingMagicLinkResult> {
  if (!token || token.length < 16) return { ok: false, reason: "invalid" };

  const row = await prisma.listingLeadMagicLink.findUnique({
    where: { tokenHash: hashMagicToken(token) },
    include: {
      lead: { include: { listing: { select: { hashId: true } } } },
    },
  });
  if (!row) return { ok: false, reason: "invalid" };
  if (row.consumedAt || row.expiresAt.getTime() < Date.now()) {
    return {
      ok: false,
      reason: "expired",
      hashId: row.lead.listing.hashId,
    };
  }

  await prisma.$transaction([
    prisma.listingLeadMagicLink.update({
      where: { id: row.id },
      data: { consumedAt: new Date() },
    }),
    prisma.listingLead.update({
      where: { id: row.leadId },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: row.lead.emailVerifiedAt ?? new Date(),
      },
    }),
  ]);

  const alreadyVerified = Boolean(row.lead.isEmailVerified);
  if (!alreadyVerified) {
    await notifyDeskOfVerifiedListingLead(row.leadId);
  }

  return {
    ok: true,
    leadId: row.leadId,
    hashId: row.lead.listing.hashId,
    email: row.lead.email,
    name: row.lead.name,
    alreadyVerified,
  };
}

export async function notifyDeskOfVerifiedListingLead(leadId: string) {
  const lead = await prisma.listingLead.findUnique({
    where: { id: leadId },
    include: { listing: { select: { id: true, hashId: true, industry: true } } },
  });
  if (!lead || !lead.isEmailVerified) return;

  const existingTicket = await prisma.crmTicket.findFirst({
    where: { listingId: lead.listingId, contactEmail: lead.email, source: "buysell_unlock" },
    select: { id: true },
  });
  if (!existingTicket) {
    await prisma.crmTicket.create({
      data: {
        buyerId: lead.buyerId,
        contactName: lead.name,
        contactEmail: lead.email,
        listingId: lead.listingId,
        source: "buysell_unlock",
        priority: "HIGH",
        notes: `${lead.name} (${lead.firm ?? "Independent"}) · ${lead.phone} requested the full profile for ${lead.listing.hashId}. Email verified.`,
      },
    });
  }

  await notifyRoles(["ADMIN", "ADVISOR"], {
    type: "listing.lead_verified",
    title: `Verified profile request: ${lead.listing.hashId}`,
    body: `${lead.name} · ${lead.firm ?? "Independent"} · ${lead.email}`,
    href: "/advisor/crm?tab=buyers",
    details: compactDetails({
      Listing: lead.listing.hashId,
      Name: lead.name,
      Firm: lead.firm,
      Phone: lead.phone,
      Email: lead.email,
      Type: lead.investorType.replace(/_/g, " "),
      Timeframe: lead.investmentTimeframe.replace(/_/g, " "),
    }),
  }).catch((err) => console.error("[marketplace] failed to notify advisors on verified lead", err));

  await logEvent({
    type: "listing_lead_verified",
    sessionId: lead.buyerId ?? lead.id,
    userId: lead.buyerId,
    entityType: "Listing",
    entityId: lead.listingId,
  });

  if (!existingTicket) {
    await logEvent({
      type: "crm_ticket_created",
      sessionId: lead.buyerId ?? lead.id,
      userId: lead.buyerId,
      entityType: "Listing",
      entityId: lead.listingId,
    });
  }
}

export async function findListingLeadForResend(listingId: string, email: string) {
  return prisma.listingLead.findUnique({
    where: { listingId_email: { listingId, email: email.trim().toLowerCase() } },
    include: { listing: { select: { hashId: true, status: true } } },
  });
}
