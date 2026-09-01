import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { createProject, getPublicProjects } from "@/lib/project-bank";
import { formatZodError, projectCreateSchema } from "@/lib/project-bank-schemas";
import { isOwnedObjectKey } from "@/lib/file-type";
import type { CapexRange, FundingStage, ProjectSector } from "@prisma/client";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "project:create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = projectCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const keys = [
    ...(parsed.data.visualAssetKeys ?? []),
    parsed.data.vault.financialModelS3Key,
    parsed.data.vault.fullPitchDeckS3Key,
  ].filter((key): key is string => Boolean(key));

  if (keys.some((key) => !isOwnedObjectKey(key, session.user.id, "projects/"))) {
    return NextResponse.json({ error: "Invalid file upload." }, { status: 400 });
  }

  const project = await createProject(session.user.id, {
    ...parsed.data,
    visualAssetUrls: parsed.data.visualAssetKeys,
    vault: {
      ...parsed.data.vault,
      founderEmail: parsed.data.vault.founderEmail || session.user.email || "",
    },
  });
  return NextResponse.json({ id: project.id, slug: project.slug }, { status: 201 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projects = await getPublicProjects({
    sector: (searchParams.get("sector") as ProjectSector | null) || undefined,
    capexRange: (searchParams.get("capexRange") as CapexRange | null) || undefined,
    fundingStage: (searchParams.get("fundingStage") as FundingStage | null) || undefined,
  });
  return NextResponse.json({ projects });
}
