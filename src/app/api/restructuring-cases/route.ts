import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { SAFE_USER_SELECT } from "@/lib/safe-user";

const schema = z.object({
  clientEmail: z.string().email(),
  assetName: z.string().min(2),
  diagnosisText: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "restructuring:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const client = await prisma.user.findUnique({ where: { email: parsed.data.clientEmail } });
  if (!client) return NextResponse.json({ error: "No user found with that email" }, { status: 404 });

  const restructuringCase = await prisma.restructuringCase.create({
    data: { clientId: client.id, assetName: parsed.data.assetName, diagnosisText: parsed.data.diagnosisText },
  });

  return NextResponse.json({ id: restructuringCase.id }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "restructuring:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const cases = await prisma.restructuringCase.findMany({
    include: { client: { select: SAFE_USER_SELECT }, reviewCycles: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ cases });
}
