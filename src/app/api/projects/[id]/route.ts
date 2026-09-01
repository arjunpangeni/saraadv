import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { deleteProjectListing, updateProjectAsAdvisor } from "@/lib/project-bank";
import { formatZodError, teaserSchema, vaultSchema } from "@/lib/project-bank-schemas";
import { isOwnedObjectKey } from "@/lib/file-type";
import { z } from "zod";

const updateSchema = z.object({
  teaser: teaserSchema.partial().omit({ visualAssetKeys: true }).optional(),
  vault: vaultSchema.optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "crm:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  if (parsed.data.vault) {
    const existing = await prisma.projectVault.findUnique({
      where: { projectId: id },
      select: { financialModelS3Key: true, fullPitchDeckS3Key: true },
    });
    const allowed = (key: string | undefined, previous?: string | null) => {
      if (!key) return true;
      if (previous && key === previous) return true;
      return isOwnedObjectKey(key, session.user.id, "projects/");
    };
    if (
      !allowed(parsed.data.vault.financialModelS3Key, existing?.financialModelS3Key) ||
      !allowed(parsed.data.vault.fullPitchDeckS3Key, existing?.fullPitchDeckS3Key)
    ) {
      return NextResponse.json({ error: "Invalid file upload." }, { status: 400 });
    }
  }

  const project = await updateProjectAsAdvisor(
    id,
    session.user.id,
    parsed.data.teaser ?? {},
    parsed.data.vault
  );
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json({ project });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "crm:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const project = await deleteProjectListing(id, session.user.id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json({ ok: true, project });
}
