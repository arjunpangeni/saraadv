import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { isDeskRole } from "@/lib/rbac";

const schema = z.object({
  phone: z
    .string()
    .min(7, "Enter a valid phone number with country code (e.g. +977…).")
    .refine((value) => normalizePhone(value) !== null, {
      message: "Enter a valid phone number with country code (e.g. +977… or +1…).",
    })
    .transform((value) => normalizePhone(value)!),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  if (isDeskRole(session.user.role)) {
    return NextResponse.json({ error: "Desk accounts manage contact details separately." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Enter a valid phone number." },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phone: parsed.data.phone },
  });

  return NextResponse.json({ ok: true, phone: parsed.data.phone });
}
