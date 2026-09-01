import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const limited = rateLimit(`credentials-check:${clientIp(req)}`, 10, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ status: "invalid", error: rateLimitResponse(limited.retryAfter).error }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ status: "invalid", error: "Enter your email and password." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (!user || !user.passwordHash) {
    return NextResponse.json({ status: "invalid", error: "Invalid email or password." });
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ status: "invalid", error: "Invalid email or password." });
  }

  if (!user.emailVerified) {
    return NextResponse.json({ status: "unverified", email: user.email });
  }

  return NextResponse.json({ status: "ok" });
}
