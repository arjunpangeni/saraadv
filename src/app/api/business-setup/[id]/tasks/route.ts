import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  addCustomTask,
  addLibraryTasks,
  generateChecklistForSetup,
} from "@/lib/business-setup";
import { prisma } from "@/lib/prisma";

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("generate"),
    replace: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("add_library"),
    codes: z.array(z.string()).min(1),
  }),
  z.object({
    action: z.literal("add_custom"),
    title: z.string().min(2).max(300),
    authority: z.string().max(200).optional(),
    notes: z.string().max(2000).optional(),
  }),
]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADVISOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const rules = await prisma.regulatoryRule.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    select: { code: true, title: true, authority: true, category: true },
  });
  const tasks = await prisma.complianceTask.findMany({
    where: { setupId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ rules, tasks });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADVISOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    if (parsed.data.action === "generate") {
      const tasks = await generateChecklistForSetup(id, parsed.data.replace ?? false);
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "complianceTask.generate",
          entity: "BusinessSetup",
          entityId: id,
          metadata: { count: tasks.length, replace: parsed.data.replace ?? false },
        },
      });
      return NextResponse.json({ tasks });
    }

    if (parsed.data.action === "add_library") {
      const tasks = await addLibraryTasks(id, parsed.data.codes);
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "complianceTask.addLibrary",
          entity: "BusinessSetup",
          entityId: id,
          metadata: { codes: parsed.data.codes },
        },
      });
      return NextResponse.json({ tasks });
    }

    const task = await addCustomTask(id, {
      title: parsed.data.title,
      authority: parsed.data.authority ?? "ASAR Partners",
      notes: parsed.data.notes,
    });
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "complianceTask.addCustom",
        entity: "ComplianceTask",
        entityId: task.id,
      },
    });
    return NextResponse.json({ task });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    if (message === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (message === "CHECKLIST_EXISTS") {
      return NextResponse.json(
        { error: "Checklist already exists. Pass replace: true to regenerate." },
        { status: 409 }
      );
    }
    throw err;
  }
}
