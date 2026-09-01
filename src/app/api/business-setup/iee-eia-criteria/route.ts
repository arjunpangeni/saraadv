import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const criteria = await prisma.ieeEiaCriterion.findMany({
    orderBy: [{ sector: "asc" }, { sortOrder: "asc" }],
    select: { id: true, sector: true, scope: true, level: true },
  });

  const bySector = criteria.reduce<Record<string, typeof criteria>>((acc, c) => {
    if (!acc[c.sector]) acc[c.sector] = [];
    acc[c.sector].push(c);
    return acc;
  }, {});

  return NextResponse.json({ criteria, bySector });
}
