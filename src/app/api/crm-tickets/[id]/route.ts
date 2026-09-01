import { NextResponse } from "next/server";
import { z } from "zod";
import { TicketStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { SAFE_USER_SELECT } from "@/lib/safe-user";

const updateSchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  notes: z.string().max(5000).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "crm:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.status === undefined && parsed.data.notes === undefined) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const ticket = await prisma.crmTicket.update({
    where: { id },
    data: {
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
    },
    include: {
      buyer: { select: SAFE_USER_SELECT },
      listing: { select: { id: true, hashId: true, status: true } },
      project: { select: { id: true, title: true, slug: true, status: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: parsed.data.status
        ? `crm_ticket.status.${parsed.data.status}`
        : "crm_ticket.notes_updated",
      entity: "CrmTicket",
      entityId: id,
    },
  });

  return NextResponse.json({ ticket });
}
