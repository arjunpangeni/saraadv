import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isSignupRole, safeCallbackUrl } from "@/lib/auth-utils";
import { issueEmailOtp } from "@/lib/otp";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().min(2, "Enter your full name."),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(12, "Use at least 12 characters."),
  role: z.enum(["SELLER", "ENTREPRENEUR"]),
  callbackUrl: z.string().optional(),
});

export async function POST(req: Request) {
  const limited = rateLimit(`register:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(rateLimitResponse(limited.retryAfter), { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || "Check the form and try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { name, password, role } = parsed.data;
  if (!isSignupRole(role)) {
    return NextResponse.json({ error: "Choose a valid account type." }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();
  const callbackUrl = safeCallbackUrl(parsed.data.callbackUrl);

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (existing?.emailVerified) {
    return NextResponse.json(
      { error: "An account with this email already exists. Sign in, or continue with Google." },
      { status: 409 }
    );
  }

  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role, emailVerified: null },
    });
    await prisma.auditLog.create({
      data: { actorId: user.id, action: "user.register", entity: "User", entityId: user.id },
    });
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: existing.id },
      data: { name, passwordHash, role },
    });
  }

  const otp = await issueEmailOtp(email, "register");
  if (!otp.ok) {
    return NextResponse.json({ error: otp.error, retryAfter: otp.retryAfter, needsVerification: true, email, callbackUrl }, { status: 429 });
  }

  return NextResponse.json(
    { needsVerification: true, email, callbackUrl },
    { status: existing ? 200 : 201 }
  );
}
