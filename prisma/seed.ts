import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";
import startABusinessRegistration from "./data/startABusinessRegistration.json";
import ieeEiaCriteria from "./data/ieeEiaCriteria.json";
import fdiNegativeList from "./data/fdiNegativeList.json";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@asarpartners.com";
const LOCAL_DEMO_PASSWORD = "Password123!";

function seedAdminPassword(): string | null {
  const fromEnv = process.env.SEED_ADMIN_PASSWORD?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") return null;
  return LOCAL_DEMO_PASSWORD;
}

async function seedAdmin() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  const password = seedAdminPassword();

  if (!existing) {
    if (!password) {
      console.warn(
        `Skipping admin create: set SEED_ADMIN_PASSWORD to create ${ADMIN_EMAIL} in production.`
      );
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: "ASAR Admin",
        role: "ADMIN",
        passwordHash,
        verified: true,
        emailVerified: new Date(),
      },
    });
    console.log(`Created admin ${ADMIN_EMAIL}`);
    return;
  }

  // Never overwrite an existing password hash (deploy seeds must not reset prod credentials).
  await prisma.user.update({
    where: { email: ADMIN_EMAIL },
    data: {
      name: existing.name || "ASAR Admin",
      role: "ADMIN",
      verified: true,
      emailVerified: existing.emailVerified ?? new Date(),
    },
  });
  console.log(`Ensured admin ${ADMIN_EMAIL} (password unchanged)`);
}

async function seedLocalDemoUsers() {
  const users: { email: string; name: string; role: "ADVISOR" | "SELLER" | "ENTREPRENEUR" | "INVESTOR" }[] = [
    { email: "advisor@asarpartners.com", name: "ASAR Advisor", role: "ADVISOR" },
    { email: "seller@example.com", name: "Demo Seller", role: "SELLER" },
    { email: "entrepreneur@example.com", name: "Demo Entrepreneur", role: "ENTREPRENEUR" },
    { email: "investor@example.com", name: "Demo Investor", role: "INVESTOR" },
  ];

  const passwordHash = await bcrypt.hash(LOCAL_DEMO_PASSWORD, 12);

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        passwordHash,
        verified: u.role === "INVESTOR" || u.role === "ADVISOR",
        emailVerified: new Date(),
      },
      create: {
        ...u,
        passwordHash,
        verified: u.role === "INVESTOR" || u.role === "ADVISOR",
        emailVerified: new Date(),
      },
    });
  }
}

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

  await seedAdmin();

  if (process.env.NODE_ENV === "production") {
    console.log("Skipping local demo users in production.");
  } else {
    console.log("Seeding local demo users...");
    await seedLocalDemoUsers();
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
