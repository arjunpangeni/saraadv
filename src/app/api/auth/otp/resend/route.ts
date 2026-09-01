import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issueEmailOtp } from "@/lib/otp";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const limited = rateLimit(`otp-resend:${clientIp(req)}`, 8, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(rateLimitResponse(limited.retryAfter), { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (!user) {
    return NextResponse.json({ error: "No account found for that email." }, { status: 404 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ error: "This email is already verified. You can sign in." }, { status: 400 });
  }

  const otp = await issueEmailOtp(email, "register");
  if (!otp.ok) {
    return NextResponse.json({ error: otp.error, retryAfter: otp.retryAfter }, { status: 429 });
  }

  return NextResponse.json({ ok: true });
}
