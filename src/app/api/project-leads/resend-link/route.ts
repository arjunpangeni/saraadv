import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { findProjectBySlugOrId } from "@/lib/project-bank";
import { findLeadForResend, issueProjectLeadMagicLink, maskEmail } from "@/lib/project-bank-magic-link";

const schema = z.object({
  email: z.string().email(),
  projectId: z.string().min(1),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`project-lead-resend:${ip}`, 3, 15 * 60 * 1000);
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
  const emailLimited = rateLimit(`project-lead-resend-email:${email}`, 3, 60 * 60 * 1000);
  if (!emailLimited.ok) {
    return NextResponse.json(
      {
        error: "Too many confirmation emails to this address. Try again later.",
        retryAfter: emailLimited.retryAfter,
      },
      { status: 429 }
    );
  }

  const project = await findProjectBySlugOrId(parsed.data.projectId);
  if (!project || project.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const lead = await findLeadForResend(project.id, email);
  if (!lead) {
    return NextResponse.json({ error: "No pending request for this email." }, { status: 404 });
  }
  if (lead.isEmailVerified) {
    return NextResponse.json({ alreadyVerified: true, email: maskEmail(email), projectSlug: project.slug });
  }

  const issued = await issueProjectLeadMagicLink({
    leadId: lead.id,
    email,
    name: lead.name,
    projectTitle: project.title,
  });
  if (!issued.ok) {
    return NextResponse.json({ error: issued.error, retryAfter: issued.retryAfter }, { status: 429 });
  }

  return NextResponse.json({
    ok: true,
    email: maskEmail(email),
    projectSlug: project.slug,
    retryAfter: issued.retryAfter,
  });
}
