import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { can, isDeskRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

const verifySchema = z.object({ verified: z.boolean() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "crm:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (isDeskRole(existing.role)) {
    return NextResponse.json({ error: "Desk accounts are not verified here." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { verified: parsed.data.verified },
    select: { id: true, email: true, name: true, role: true, verified: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: parsed.data.verified ? "user.verified" : "user.unverified",
      entity: "User",
      entityId: id,
    },
  });

  return NextResponse.json({ user });
}
