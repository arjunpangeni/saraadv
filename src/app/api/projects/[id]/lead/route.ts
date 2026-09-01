import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/analytics";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { findProjectBySlugOrId } from "@/lib/project-bank";
import { leadInquirySchema } from "@/lib/project-bank-schemas";
import { issueProjectLeadMagicLink, maskEmail } from "@/lib/project-bank-magic-link";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(`project-lead:${clientIp(req)}`, 8, 60 * 60 * 1000);
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
  const project = await findProjectBySlugOrId(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (project.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Project is not available for inquiries" }, { status: 403 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existingUser = await prisma.user.findUnique({ where: { email } });
  const buyerId = existingUser?.id;

  const existingLead = await prisma.projectLead.findUnique({
    where: { projectId_email: { projectId: project.id, email } },
  });

  if (existingLead?.isEmailVerified) {
    return NextResponse.json({
      alreadyVerified: true,
      email: maskEmail(email),
      projectSlug: project.slug,
    });
  }

  const lead =
    existingLead ??
    (await prisma.projectLead.create({
      data: {
        projectId: project.id,
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
    await prisma.projectLead.update({
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

  const issued = await issueProjectLeadMagicLink({
    leadId: lead.id,
    email,
    name: parsed.data.name,
    projectTitle: project.title,
  });
  if (!issued.ok) {
    return NextResponse.json({ error: issued.error, retryAfter: issued.retryAfter }, { status: 429 });
  }

  await logEvent({
    type: "project_lead_submitted",
    sessionId: session?.user?.id ?? lead.id,
    userId: buyerId,
    entityType: "ProjectListing",
    entityId: project.id,
    metadata: { email, firm: parsed.data.firm, phone: parsed.data.phone },
  });

  return NextResponse.json(
    {
      leadId: lead.id,
      email: maskEmail(email),
      projectSlug: project.slug,
      alreadySubmitted: Boolean(existingLead),
    },
    { status: existingLead ? 200 : 201 }
  );
}
