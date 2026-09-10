import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSignupRole } from "@/lib/auth-utils";

const schema = z.object({
  role: z.enum(["SELLER", "ENTREPRENEUR"]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !isSignupRole(parsed.data.role)) {
    return NextResponse.json({ error: "Choose what you want to do on ASAR." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (user.role === "ADMIN" || user.role === "ADVISOR") {
    return NextResponse.json({ error: "Desk accounts cannot change role here." }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { role: parsed.data.role },
  });

  return NextResponse.json({ ok: true, role: parsed.data.role });
}
