import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/analytics";

const schema = z.object({
  name: z.string().min(2),
  type: z.enum(["RENEWABLE_ENERGY", "FORESTRY", "AGRICULTURE", "WASTE_MANAGEMENT"]),
  standard: z.enum(["VERIFIED_CARBON_STANDARD", "GOLD_STANDARD"]).optional(),
  estimatedCredits: z.number().min(0).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "carbon:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const project = await prisma.carbonProject.create({
    data: { ownerId: session.user.id, ...parsed.data },
  });

  await logEvent({
    type: "carbon_project_created",
    sessionId: session.user.id,
    userId: session.user.id,
    entityType: "CarbonProject",
    entityId: project.id,
  });

  return NextResponse.json({ id: project.id }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const projects = await prisma.carbonProject.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ projects });
}
