import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";
import startABusinessRegistration from "./data/startABusinessRegistration.json";
import ieeEiaCriteria from "./data/ieeEiaCriteria.json";
import fdiNegativeList from "./data/fdiNegativeList.json";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding regulatory reference data...");

  for (const rule of startABusinessRegistration) {
    await prisma.regulatoryRule.upsert({
      where: { code: rule.code },
      update: rule,
      create: rule,
    });
  }

  await prisma.ieeEiaCriterion.deleteMany();
  await prisma.ieeEiaCriterion.createMany({
    data: ieeEiaCriteria.map((c) => ({
      sector: c.sector,
      scope: c.scope,
      level: c.level as "BRIEF" | "IEE" | "EIA",
      sortOrder: c.sortOrder,
    })),
  });

  for (const item of fdiNegativeList) {
    await prisma.fdiNegativeListItem.upsert({
      where: { code: item.code },
      update: item,
      create: item,
    });
  }

  console.log("Seeding demo users...");
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    console.log("Skipping demo users in production. Set ALLOW_DEMO_SEED=true to override.");
  } else {
  const users: { email: string; name: string; role: "ADMIN" | "ADVISOR" | "SELLER" | "BUYER" | "ENTREPRENEUR" | "INVESTOR" }[] = [
    { email: "admin@saraadvisors.com", name: "SARA Admin", role: "ADMIN" },
    { email: "advisor@saraadvisors.com", name: "SARA Advisor", role: "ADVISOR" },
    { email: "seller@example.com", name: "Demo Seller", role: "SELLER" },
    { email: "entrepreneur@example.com", name: "Demo Entrepreneur", role: "ENTREPRENEUR" },
    { email: "investor@example.com", name: "Demo Investor", role: "INVESTOR" },
  ];

  const passwordHash = await bcrypt.hash("Password123!", 12);

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        passwordHash,
        verified: u.role === "BUYER" || u.role === "INVESTOR" || u.role === "ADMIN" || u.role === "ADVISOR",
        emailVerified: new Date(),
      },
      create: {
        ...u,
        passwordHash,
        verified: u.role === "BUYER" || u.role === "INVESTOR" || u.role === "ADMIN" || u.role === "ADVISOR",
        emailVerified: new Date(),
      },
    });
  }

  console.log("Seed complete. Demo login password for all demo users: Password123!");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
