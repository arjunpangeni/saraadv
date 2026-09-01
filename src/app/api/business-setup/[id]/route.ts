import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getBusinessSetupForAdvisor } from "@/lib/business-setup";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  contactName: z.string().trim().min(1).max(60).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^(97|98)\d{8}$/, "Enter a 10-digit Nepal mobile starting with 97 or 98")
    .optional(),
  email: z.string().trim().email().max(200).optional(),
  objective: z.enum(["MANUFACTURING", "TRADING", "SERVICE"]).optional(),
  businessType: z
    .enum(["PRIVATE_LIMITED", "PUBLIC_LIMITED", "PROPRIETORSHIP", "PARTNERSHIP"])
    .optional(),
  fdiRequested: z.boolean().optional(),
  status: z
    .enum(["INTAKE", "RULES_GENERATED", "CONTACTED", "IN_PROGRESS", "COMPLETED", "ARCHIVED"])
    .optional(),
  equityInvestment: z.number().nonnegative().optional(),
  loanInvestment: z.number().nonnegative().optional(),
  headOfficeDistrict: z.string().trim().min(1).max(120).optional(),
  headOfficeLocalBody: z.string().trim().min(1).max(120).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADVISOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const setup = await getBusinessSetupForAdvisor(id);
  if (!setup) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ setup });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADVISOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.businessSetup.findUnique({
    where: { id },
    include: { addresses: true, investment: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const headOffice = existing.addresses.find((a) => a.kind === "HEAD_OFFICE");

  const setup = await prisma.$transaction(async (tx) => {
    if (
      data.equityInvestment !== undefined ||
      data.loanInvestment !== undefined
    ) {
      if (existing.investment) {
        await tx.setupInvestment.update({
          where: { setupId: id },
          data: {
            ...(data.equityInvestment !== undefined
              ? { equityInvestment: data.equityInvestment }
              : {}),
            ...(data.loanInvestment !== undefined ? { loanInvestment: data.loanInvestment } : {}),
          },
        });
      } else {
        await tx.setupInvestment.create({
          data: {
            setupId: id,
            equityInvestment: data.equityInvestment ?? 0,
            loanInvestment: data.loanInvestment ?? 0,
            fixedAssets: 0,
            plantMachineryCost: 0,
            netCurrentAssets: 0,
          },
        });
      }
    }

    if (
      (data.headOfficeDistrict !== undefined || data.headOfficeLocalBody !== undefined) &&
      headOffice
    ) {
      await tx.setupAddress.update({
        where: { id: headOffice.id },
        data: {
          ...(data.headOfficeDistrict !== undefined
            ? { district: data.headOfficeDistrict }
            : {}),
          ...(data.headOfficeLocalBody !== undefined
            ? { localBody: data.headOfficeLocalBody }
            : {}),
        },
      });
    }

    return tx.businessSetup.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.contactName !== undefined ? { contactName: data.contactName } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.email !== undefined ? { email: data.email.toLowerCase() } : {}),
        ...(data.objective !== undefined ? { objective: data.objective } : {}),
        ...(data.businessType !== undefined ? { businessType: data.businessType } : {}),
        ...(data.fdiRequested !== undefined ? { fdiRequested: data.fdiRequested } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
      include: {
        addresses: true,
        investment: true,
      },
    });
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: data.status === "ARCHIVED" ? "businessSetup.archive" : "businessSetup.update",
      entity: "BusinessSetup",
      entityId: id,
      metadata: { fields: Object.keys(data) },
    },
  });

  return NextResponse.json({ setup });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADVISOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.businessSetup.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.businessSetup.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "businessSetup.delete",
      entity: "BusinessSetup",
      entityId: id,
      metadata: {},
    },
  });

  return NextResponse.json({ ok: true });
}
