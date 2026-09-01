import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyRoles } from "@/lib/notifications";
import { compactDetails } from "@/lib/mail";
import {
  isServiceInquiryType,
  SERVICE_INQUIRY_LABELS,
  SERVICE_INQUIRY_TYPES,
} from "@/lib/service-inquiries";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { NEPAL_MOBILE, isValidEmail } from "@/lib/nepal-locations";

const createSchema = z.object({
  type: z.enum(SERVICE_INQUIRY_TYPES),
  contactName: z.string().min(2),
  phone: z.string().regex(NEPAL_MOBILE, "Enter a 10-digit mobile starting with 97 or 98."),
  email: z
    .string()
    .email("Enter a valid email.")
    .refine((value) => isValidEmail(value), "Enter a valid email (e.g. you@example.com)."),
  subject: z.string().max(200).optional(),
  message: z.string().min(10).max(4000),
  website: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || !["ADVISOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  const inquiries = await prisma.serviceInquiry.findMany({
    where: {
      ...(isServiceInquiryType(type) ? { type } : {}),
      ...(status === "NEW" || status === "CONTACTED" || status === "CLOSED" ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ inquiries });
}

export async function POST(req: Request) {
  const limited = rateLimit(`service-inquiry:${clientIp(req)}`, 10, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(rateLimitResponse(limited.retryAfter), { status: 429 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Check the form and try again.";
    return NextResponse.json({ error: first }, { status: 400 });
  }
  if (parsed.data.website?.trim()) {
    return NextResponse.json({ ok: true });
  }

  const { website: _, ...data } = parsed.data;
  const inquiry = await prisma.serviceInquiry.create({ data });

  const label = SERVICE_INQUIRY_LABELS[data.type];
  await notifyRoles(["ADMIN", "ADVISOR"], {
    type: "service_inquiry.new",
    title: `New ${label} inquiry: ${data.contactName}`,
    body: data.subject || data.message.slice(0, 120),
    href: `/advisor/inquiries?type=${data.type}`,
    details: compactDetails({
      Service: label,
      Name: data.contactName,
      Email: data.email,
      Phone: data.phone,
      Subject: data.subject,
      Message: data.message,
    }),
  }).catch(() => {});

  return NextResponse.json({ ok: true, id: inquiry.id });
}
