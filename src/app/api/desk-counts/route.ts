import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  const unread = await prisma.notification.count({
    where: { userId: session.user.id, readAt: null },
  });

  if (role !== "ADVISOR" && role !== "ADMIN") {
    return NextResponse.json({
      inquiries: 0,
      setups: 0,
      listings: 0,
      ideas: 0,
      notifications: unread,
    });
  }

  const [inquiries, setups, listings, ideas] = await Promise.all([
    prisma.serviceInquiry.count({ where: { status: "NEW" } }),
    prisma.businessSetup.count({
      where: { status: { in: ["INTAKE", "RULES_GENERATED", "IN_PROGRESS"] } },
    }),
    prisma.listing.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.projectListing.count({ where: { status: "PENDING_REVIEW" } }),
  ]);

  return NextResponse.json({
    inquiries,
    setups,
    listings,
    ideas,
    notifications: unread,
  });
}
