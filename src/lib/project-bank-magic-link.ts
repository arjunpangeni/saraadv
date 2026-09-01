import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { compactDetails, sendProjectBankMagicLinkEmail } from "@/lib/mail";
import { notifyRoles } from "@/lib/notifications";
import { logEvent } from "@/lib/analytics";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 2 * 60 * 1000;
const MAX_LINKS_PER_DAY = 3;

export const MAGIC_LINK_RESEND_COOLDOWN_SEC = RESEND_COOLDOWN_MS / 1000;

function tokenSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required to issue Project Bank magic links.");
  }
  return secret;
}

export function hashMagicToken(token: string) {
  return createHash("sha256").update(`${tokenSecret()}:${token}`).digest("hex");
}

export function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const keep = Math.min(2, user.length);
  return `${user.slice(0, keep)}***@${domain}`;
}

export async function issueProjectLeadMagicLink(opts: {
  leadId: string;
  email: string;
  name: string;
  projectTitle: string;
}) {
  const dayAgo = new Date(Date.now() - TOKEN_TTL_MS);
  const [issuedToday, latest] = await Promise.all([
    prisma.projectLeadMagicLink.count({
      where: { leadId: opts.leadId, createdAt: { gte: dayAgo } },
    }),
    prisma.projectLeadMagicLink.findFirst({
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
    const oldestToday = await prisma.projectLeadMagicLink.findFirst({
      where: { leadId: opts.leadId, createdAt: { gte: dayAgo } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    const wait = oldestToday
      ? Math.max(1, Math.ceil((oldestToday.createdAt.getTime() + TOKEN_TTL_MS - Date.now()) / 1000))
      : 60 * 60;
    return {
      ok: false as const,
      error: "You can request up to 3 confirmation emails per day for this project.",
      retryAfter: wait,
    };
  }

  await prisma.projectLeadMagicLink.updateMany({
    where: { leadId: opts.leadId, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const token = randomBytes(32).toString("base64url");
  await prisma.projectLeadMagicLink.create({
    data: {
      leadId: opts.leadId,
      tokenHash: hashMagicToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const sent = await sendProjectBankMagicLinkEmail({
    to: opts.email,
    name: opts.name,
    projectTitle: opts.projectTitle,
    verifyHref: `/project-bank/verify?token=${encodeURIComponent(token)}`,
  });

  if (sent.skipped) {
    console.info(`[project-bank] magic link email skipped for ${opts.email} — configure Resend`);
    if (process.env.NODE_ENV !== "production") {
      console.info(`[project-bank] magic link: /project-bank/verify?token=${token}`);
    }
  }

  return { ok: true as const, skipped: sent.skipped, retryAfter: MAGIC_LINK_RESEND_COOLDOWN_SEC };
}

export type ConsumeMagicLinkResult =
  | { ok: true; leadId: string; projectSlug: string; projectTitle: string; alreadyVerified?: boolean }
  | { ok: false; reason: "invalid" | "expired"; projectSlug?: string };

export async function consumeProjectLeadMagicLink(token: string): Promise<ConsumeMagicLinkResult> {
  if (!token || token.length < 16) return { ok: false, reason: "invalid" };

  const row = await prisma.projectLeadMagicLink.findUnique({
    where: { tokenHash: hashMagicToken(token) },
    include: {
      lead: { include: { project: { select: { slug: true, title: true } } } },
    },
  });
  if (!row) return { ok: false, reason: "invalid" };
  if (row.consumedAt || row.expiresAt.getTime() < Date.now()) {
    return {
      ok: false,
      reason: "expired",
      projectSlug: row.lead.project.slug,
    };
  }

  await prisma.$transaction([
    prisma.projectLeadMagicLink.update({
      where: { id: row.id },
      data: { consumedAt: new Date() },
    }),
    prisma.projectLead.update({
      where: { id: row.leadId },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: row.lead.emailVerifiedAt ?? new Date(),
      },
    }),
  ]);

  const alreadyVerified = Boolean(row.lead.isEmailVerified);
  if (!alreadyVerified) {
    await notifyDeskOfVerifiedLead(row.leadId);
  }

  return {
    ok: true,
    leadId: row.leadId,
    projectSlug: row.lead.project.slug,
    projectTitle: row.lead.project.title,
    alreadyVerified,
  };
}

export async function notifyDeskOfVerifiedLead(leadId: string) {
  const lead = await prisma.projectLead.findUnique({
    where: { id: leadId },
    include: { project: true },
  });
  if (!lead || !lead.isEmailVerified) return;

  const existingTicket = await prisma.crmTicket.findFirst({
    where: { projectId: lead.projectId, contactEmail: lead.email, source: "project_bank_lead" },
    select: { id: true },
  });
  if (!existingTicket) {
    await prisma.crmTicket.create({
      data: {
        buyerId: lead.buyerId,
        contactName: lead.name,
        contactEmail: lead.email,
        projectId: lead.projectId,
        source: "project_bank_lead",
        priority: "HIGH",
        notes: `${lead.name} (${lead.firm ?? "Independent"}) · ${lead.phone} requested the full dossier for "${lead.project.title}". Email verified.`,
      },
    });
  }

  await notifyRoles(["ADMIN", "ADVISOR"], {
    type: "project.lead_verified",
    title: `Verified dossier request: ${lead.project.title}`,
    body: `${lead.name} · ${lead.firm ?? "Independent"} · ${lead.email}`,
    href: "/advisor/crm?tab=investors",
    details: compactDetails({
      Project: lead.project.title,
      Name: lead.name,
      Firm: lead.firm,
      Phone: lead.phone,
      Email: lead.email,
      Type: lead.investorType.replace(/_/g, " "),
      Timeframe: lead.investmentTimeframe.replace(/_/g, " "),
    }),
  }).catch((err) => console.error("[project-bank] failed to notify advisors on verified lead", err));

  await logEvent({
    type: "project_lead_verified",
    sessionId: lead.buyerId ?? lead.id,
    userId: lead.buyerId,
    entityType: "ProjectListing",
    entityId: lead.projectId,
  });

  if (!existingTicket) {
    await logEvent({
      type: "crm_ticket_created",
      sessionId: lead.buyerId ?? lead.id,
      userId: lead.buyerId,
      entityType: "ProjectListing",
      entityId: lead.projectId,
    });
  }
}

export async function findLeadForResend(projectId: string, email: string) {
  return prisma.projectLead.findUnique({
    where: { projectId_email: { projectId, email: email.trim().toLowerCase() } },
    include: { project: { select: { title: true, slug: true, status: true } } },
  });
}
