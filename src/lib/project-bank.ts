import type {
  CapexRange,
  FundingStage,
  ProjectSector,
  ProjectStatus,
} from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { notifyRoles, notifyUsers } from "@/lib/notifications";
import { compactDetails, sendOwnerProjectDecisionEmail } from "@/lib/mail";
import { SAFE_USER_SELECT } from "@/lib/safe-user";
import { upsertProjectEmbedding } from "@/lib/ai-search";
import { deleteStorageKeys } from "@/lib/storage";
import {
  capexLabel,
  irrLabel,
  parseUseOfFunds,
  sectorLabel,
  stageLabel,
  type UseOfFundsItem,
} from "@/types/project-bank";

const PUBLIC_TEASER_SELECT = {
  id: true,
  slug: true,
  title: true,
  sector: true,
  broadRegion: true,
  elevatorPitch: true,
  capexRange: true,
  targetRoiIrr: true,
  fundingStage: true,
  capitalSought: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const PREVIEW_TEASER_SELECT = {
  ...PUBLIC_TEASER_SELECT,
  ownerId: true,
} as const;

export interface VaultInput {
  exactAddress: string;
  lat?: number | null;
  lng?: number | null;
  founderFullName: string;
  founderEmail?: string;
  founderPhone: string;
  companyName?: string;
  registrationStatus?: string;
  detailedBreakdown?: string;
  competitiveMoat?: string;
  prototypeUrl?: string;
  financialModelS3Key?: string;
  bootstrapCapitalInvested?: number;
  useOfFunds?: UseOfFundsItem[];
  permitsStatus?: string;
  keyRisks?: string;
  fullPitchDeckS3Key?: string;
}

export interface ProjectInput {
  title: string;
  sector: ProjectSector;
  broadRegion: string;
  elevatorPitch: string;
  capexRange: CapexRange;
  targetRoiIrr: string;
  fundingStage: FundingStage;
  capitalSought?: number;
  visualAssetUrls?: string[];
  vault: VaultInput;
}

export function canPreviewUnpublishedProject(
  project: { ownerId: string; status: string },
  userId?: string | null,
  role?: string | null
): boolean {
  if (project.status === "PUBLISHED") return true;
  if (!userId) return false;
  if (project.ownerId === userId) return true;
  return role === "ADVISOR" || role === "ADMIN";
}

export function canAccessVault(role?: string | null) {
  return role === "ADVISOR" || role === "ADMIN";
}

export function slugifyTitle(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return base || "project";
}

export async function uniqueProjectSlug(title: string, excludeId?: string) {
  const base = slugifyTitle(title);
  let slug = base;
  let n = 2;
  while (true) {
    const existing = await prisma.projectListing.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${n}`;
    n += 1;
  }
}

function vaultCreateData(input: VaultInput) {
  return {
    exactAddress: input.exactAddress,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    founderFullName: input.founderFullName,
    founderEmail: input.founderEmail || "",
    founderPhone: input.founderPhone,
    companyName: input.companyName || null,
    registrationStatus: input.registrationStatus || "",
    detailedBreakdown: input.detailedBreakdown || "",
    competitiveMoat: input.competitiveMoat || "",
    prototypeUrl: input.prototypeUrl || null,
    financialModelS3Key: input.financialModelS3Key ?? "",
    bootstrapCapitalInvested: input.bootstrapCapitalInvested ?? 0,
    useOfFunds: input.useOfFunds ?? [],
    permitsStatus: input.permitsStatus || "",
    keyRisks: input.keyRisks || "",
    fullPitchDeckS3Key: input.fullPitchDeckS3Key ?? "",
  };
}

export async function createProject(ownerId: string, input: ProjectInput) {
  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { name: true, email: true, role: true },
  });
  const loginEmail = owner?.email?.trim() || input.vault.founderEmail || "";

  const slug = await uniqueProjectSlug(input.title);
  const project = await prisma.projectListing.create({
    data: {
      ownerId,
      slug,
      title: input.title,
      sector: input.sector,
      broadRegion: input.broadRegion,
      elevatorPitch: input.elevatorPitch,
      capexRange: input.capexRange,
      targetRoiIrr: input.targetRoiIrr,
      fundingStage: input.fundingStage,
      capitalSought: input.capitalSought ?? 0,
      status: "PENDING_REVIEW",
      assets: input.visualAssetUrls
        ? { create: input.visualAssetUrls.map((s3Key) => ({ s3Key })) }
        : undefined,
      vault: { create: vaultCreateData({ ...input.vault, founderEmail: loginEmail }) },
    },
  });

  const content = [project.title, project.sector, project.broadRegion, project.elevatorPitch].join(" ");
  await upsertProjectEmbedding(project.id, content).catch(() => {});

  const listedBy =
    [input.vault.founderFullName, input.vault.founderPhone, loginEmail].filter(Boolean).join(" · ") ||
    ownerId;

  await prisma.crmTicket.create({
    data: {
      projectId: project.id,
      buyerId: ownerId,
      source: "project_review",
      priority: "HIGH",
      status: "NEW",
      notes: `New Project Bank teaser "${project.title}" submitted for advisor review by ${listedBy}.`,
    },
  });

  await notifyRoles(["ADMIN", "ADVISOR"], {
    type: "project.pending_review",
    title: `New project awaiting review: ${project.title}`,
    body: `${listedBy} · ${sectorLabel(project.sector)} · ${project.broadRegion}`,
    href: `/advisor/project-bank/${project.id}`,
    details: compactDetails({
      Project: project.title,
      "Listed by": input.vault.founderFullName,
      Phone: input.vault.founderPhone,
      Email: loginEmail,
      Role: owner?.role.replace(/_/g, " "),
      Sector: sectorLabel(project.sector),
      Location: project.broadRegion,
      CAPEX: capexLabel(project.capexRange),
      "Target IRR": irrLabel(project.targetRoiIrr),
      Stage: stageLabel(project.fundingStage),
    }),
  }).catch((err) => console.error("[project-bank] failed to notify advisors", err));

  await notifyUsers([ownerId], {
    type: "project.submitted",
    title: "Project submitted for review",
    body: `"${project.title}" is with the ASAR deal desk. You'll be notified when it goes live.`,
    href: "/dashboard",
    emailAdmin: false,
  }).catch((err) => console.error("[project-bank] failed to notify owner", err));

  await prisma.auditLog.create({
    data: { actorId: ownerId, action: "project.create", entity: "ProjectListing", entityId: project.id },
  });

  return project;
}

export type ProjectStatusUpdate = "PUBLISHED" | "ARCHIVED" | "REJECTED" | "PENDING_REVIEW";

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatusUpdate,
  actorId: string,
  reviewNotes?: string
) {
  const project = await prisma.projectListing.update({
    where: { id: projectId },
    data: {
      status,
      reviewNotes: reviewNotes ?? undefined,
      publishedAt: status === "PUBLISHED" ? new Date() : status === "PENDING_REVIEW" ? null : undefined,
    },
    include: { owner: { select: SAFE_USER_SELECT } },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: `project.status.${status}`,
      entity: "ProjectListing",
      entityId: projectId,
      metadata: { reviewNotes },
    },
  });

  if (status === "PUBLISHED") {
    await notifyUsers([project.ownerId], {
      type: "project.published",
      title: `"${project.title}" is live on Project Bank`,
      body: "Investors can now discover your teaser and request the full dossier.",
      href: `/project-bank/${project.slug}`,
      details: compactDetails({
        Project: project.title,
        Status: "Published",
        Owner: project.owner.email,
        Sector: sectorLabel(project.sector),
        Location: project.broadRegion,
      }),
    }).catch((err) => console.error("[project-bank] failed to notify owner", err));

    if (project.owner.email) {
      await sendOwnerProjectDecisionEmail({
        to: project.owner.email,
        name: project.owner.name,
        projectTitle: project.title,
        outcome: "published",
        href: `/project-bank/${project.slug}`,
      });
    }

    await prisma.crmTicket.updateMany({
      where: { projectId, source: "project_review", status: "NEW" },
      data: { status: "WON", notes: `Project "${project.title}" approved and published.` },
    });
  }

  if (status === "PENDING_REVIEW") {
    await notifyUsers([project.ownerId], {
      type: "project.archived",
      title: `"${project.title}" was taken offline`,
      body: reviewNotes || "An advisor unpublished your Project Bank teaser. It is no longer visible to investors.",
      href: "/dashboard",
      details: compactDetails({
        Project: project.title,
        Status: "Unpublished",
        Owner: project.owner.email,
        Notes: reviewNotes,
      }),
    }).catch((err) => console.error("[project-bank] failed to notify owner", err));
  }

  if (status === "ARCHIVED" || status === "REJECTED") {
    await notifyUsers([project.ownerId], {
      type: "project.archived",
      title: `"${project.title}" was not approved`,
      body: reviewNotes || "An advisor has rejected this project submission.",
      href: "/dashboard",
      details: compactDetails({
        Project: project.title,
        Status: status === "REJECTED" ? "Rejected" : "Archived",
        Owner: project.owner.email,
        Notes: reviewNotes,
      }),
    }).catch((err) => console.error("[project-bank] failed to notify owner", err));

    if (status === "REJECTED" && project.owner.email) {
      await sendOwnerProjectDecisionEmail({
        to: project.owner.email,
        name: project.owner.name,
        projectTitle: project.title,
        outcome: "rejected",
        notes: reviewNotes,
        href: "/dashboard",
      });
    }

    await prisma.crmTicket.updateMany({
      where: { projectId, source: "project_review", status: "NEW" },
      data: { status: "LOST", notes: reviewNotes || `Project "${project.title}" rejected.` },
    });
  }

  return project;
}

export type TeaserUpdateInput = {
  title?: string;
  sector?: ProjectSector;
  broadRegion?: string;
  elevatorPitch?: string;
  capexRange?: CapexRange;
  targetRoiIrr?: string;
  fundingStage?: FundingStage;
  capitalSought?: number;
};

export async function updateProjectAsAdvisor(
  projectId: string,
  actorId: string,
  teaser: TeaserUpdateInput,
  vault?: VaultInput
) {
  const existing = await prisma.projectListing.findUnique({
    where: { id: projectId },
    select: { title: true, slug: true },
  });
  if (!existing) return null;

  const slug =
    teaser.title && teaser.title !== existing.title
      ? await uniqueProjectSlug(teaser.title, projectId)
      : undefined;

  const project = await prisma.projectListing.update({
    where: { id: projectId },
    data: {
      ...teaser,
      slug,
      editedByAdmin: true,
      ...(vault
        ? {
            vault: {
              upsert: {
                create: vaultCreateData(vault),
                update: {
                  exactAddress: vault.exactAddress,
                  founderFullName: vault.founderFullName,
                  founderPhone: vault.founderPhone,
                  ...(vault.founderEmail ? { founderEmail: vault.founderEmail } : {}),
                },
              },
            },
          }
        : {}),
    },
  });

  if (teaser.title || teaser.sector || teaser.broadRegion || teaser.elevatorPitch) {
    const content = [project.title, project.sector, project.broadRegion, project.elevatorPitch].join(" ");
    await upsertProjectEmbedding(project.id, content).catch(() => {});
  }

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "project.update",
      entity: "ProjectListing",
      entityId: projectId,
    },
  });

  return project;
}

export async function deleteProjectListing(projectId: string, actorId: string) {
  const project = await prisma.projectListing.findUnique({
    where: { id: projectId },
    include: {
      vault: { select: { financialModelS3Key: true, fullPitchDeckS3Key: true } },
      assets: { select: { s3Key: true } },
      _count: { select: { leads: true } },
    },
  });
  if (!project) return null;

  const keys = [
    ...project.assets.map((asset) => asset.s3Key),
    project.vault?.financialModelS3Key,
    project.vault?.fullPitchDeckS3Key,
  ].filter((key): key is string => Boolean(key));

  await prisma.$transaction(async (tx) => {
    await tx.crmTicket.updateMany({
      where: { projectId, status: { notIn: ["WON", "LOST"] } },
      data: { status: "LOST" },
    });
    await tx.crmTicket.updateMany({
      where: { projectId },
      data: { projectId: null },
    });
    await tx.notification.deleteMany({
      where: {
        OR: [{ href: `/advisor/project-bank/${projectId}` }, { href: `/project-bank/${project.slug}` }],
      },
    });
    await tx.projectListing.delete({ where: { id: projectId } });
    await tx.auditLog.create({
      data: {
        actorId,
        action: "project.delete",
        entity: "ProjectListing",
        entityId: projectId,
        metadata: {
          title: project.title,
          status: project.status,
          leadCount: project._count.leads,
        },
      },
    });
  });

  await deleteStorageKeys(keys, "[project-bank]");

  await notifyUsers([project.ownerId], {
    type: "project.deleted",
    title: `"${project.title}" was removed`,
    body: "The deal desk deleted this Project Bank submission, including the teaser, Vault, and files.",
    href: "/dashboard",
    emailAdmin: false,
  }).catch((err) => console.error("[project-bank] failed to notify owner", err));

  return { id: projectId, title: project.title };
}

export interface ProjectFilters {
  sector?: string;
  capexRange?: string;
  fundingStage?: string;
}

export async function getPublicProjects(filters: ProjectFilters) {
  return prisma.projectListing.findMany({
    where: {
      status: "PUBLISHED",
      ...(filters.sector ? { sector: filters.sector as ProjectSector } : {}),
      ...(filters.capexRange ? { capexRange: filters.capexRange as CapexRange } : {}),
      ...(filters.fundingStage ? { fundingStage: filters.fundingStage as FundingStage } : {}),
    },
    select: { ...PUBLIC_TEASER_SELECT, assets: true },
    orderBy: { publishedAt: "desc" },
    take: 200,
  });
}

export async function findProjectBySlugOrId(slugOrId: string) {
  return prisma.projectListing.findFirst({
    where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
  });
}

export async function findPublicTeaser(slugOrId: string) {
  return prisma.projectListing.findFirst({
    where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
    select: { ...PREVIEW_TEASER_SELECT, assets: true },
  });
}

export async function findPublishedTeaserMeta(slugOrId: string) {
  return prisma.projectListing.findFirst({
    where: {
      status: "PUBLISHED",
      OR: [{ slug: slugOrId }, { id: slugOrId }],
    },
    select: { slug: true, title: true, elevatorPitch: true },
  });
}

export { parseUseOfFunds };
export type { ProjectStatus };
