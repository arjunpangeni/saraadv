import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyEmailOtp } from "@/lib/otp";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(8),
});

export async function POST(req: Request) {
  const limited = rateLimit(`otp-verify:${clientIp(req)}`, 20, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(rateLimitResponse(limited.retryAfter), { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const result = await verifyEmailOtp(email, parsed.data.code, "register");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (!user) {
    return NextResponse.json({ error: "No account found for that email." }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  });

  return NextResponse.json({ ok: true, email: user.email });
}
