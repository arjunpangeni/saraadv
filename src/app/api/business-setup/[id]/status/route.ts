import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z
  .object({
    status: z
      .enum(["INTAKE", "RULES_GENERATED", "CONTACTED", "IN_PROGRESS", "COMPLETED", "ARCHIVED"])
      .optional(),
    assignedAdvisorId: z.string().nullable().optional(),
  })
  .refine((data) => data.status !== undefined || data.assignedAdvisorId !== undefined, {
    message: "Provide status and/or assignedAdvisorId",
  });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADVISOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.assignedAdvisorId) {
    const advisor = await prisma.user.findFirst({
      where: { id: parsed.data.assignedAdvisorId, role: { in: ["ADVISOR", "ADMIN"] } },
    });
    if (!advisor) {
      return NextResponse.json({ error: "Invalid advisor" }, { status: 400 });
    }
  }

  const setup = await prisma.businessSetup.update({
    where: { id },
    data: {
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.assignedAdvisorId !== undefined
        ? { assignedAdvisorId: parsed.data.assignedAdvisorId }
        : {}),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: parsed.data.status ? "businessSetup.status" : "businessSetup.assign",
      entity: "BusinessSetup",
      entityId: setup.id,
    },
  });

  return NextResponse.json({ setup });
}
