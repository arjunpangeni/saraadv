import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "listing:create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const draft = await prisma.listingDraft.findUnique({ where: { ownerId: session.user.id } });
  return NextResponse.json({ draft: draft?.payload ?? null, updatedAt: draft?.updatedAt ?? null });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "listing:create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const raw = await req.text();
  if (raw.length > 400_000) {
    return NextResponse.json({ error: "Draft is too large." }, { status: 413 });
  }
  let payload: unknown;
  try {
    payload = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid draft." }, { status: 400 });
  }
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid draft." }, { status: 400 });
  }
  const draft = await prisma.listingDraft.upsert({
    where: { ownerId: session.user.id },
    update: { payload },
    create: { ownerId: session.user.id, payload },
  });

  return NextResponse.json({ updatedAt: draft.updatedAt });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "listing:create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.listingDraft.deleteMany({ where: { ownerId: session.user.id } });
  return NextResponse.json({ ok: true });
}
