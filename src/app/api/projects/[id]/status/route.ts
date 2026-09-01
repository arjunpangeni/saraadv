import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { updateProjectStatus } from "@/lib/project-bank";

const statusSchema = z.object({
  status: z.enum(["PUBLISHED", "ARCHIVED", "REJECTED", "PENDING_REVIEW"]),
  reviewNotes: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "crm:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await updateProjectStatus(
    id,
    parsed.data.status,
    session.user.id,
    parsed.data.reviewNotes
  );

  return NextResponse.json({ project });
}
