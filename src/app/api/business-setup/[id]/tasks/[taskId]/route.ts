import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { deleteComplianceTask } from "@/lib/business-setup";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "NOT_APPLICABLE"]).optional(),
  notes: z.string().max(2000).nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await auth();
  if (!session?.user || !["ADVISOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, taskId } = await params;
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const task = await prisma.complianceTask.findFirst({
    where: { id: taskId, setupId: id },
  });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const data: {
    status?: typeof parsed.data.status;
    notes?: string | null;
    dueDate?: Date | null;
  } = {};

  if (parsed.data.status !== undefined) data.status = parsed.data.status;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
  if (parsed.data.dueDate !== undefined) {
    data.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
  }

  const updated = await prisma.complianceTask.update({
    where: { id: taskId },
    data,
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "complianceTask.update",
      entity: "ComplianceTask",
      entityId: taskId,
    },
  });

  return NextResponse.json({ task: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await auth();
  if (!session?.user || !["ADVISOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, taskId } = await params;
  try {
    await deleteComplianceTask(id, taskId);
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "complianceTask.delete",
        entity: "ComplianceTask",
        entityId: taskId,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
