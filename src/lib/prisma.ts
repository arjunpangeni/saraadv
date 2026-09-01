import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientId?: string;
};

const CLIENT_ID = "listing-lead";

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function clientIsStale(client: PrismaClient) {
  return (
    globalForPrisma.prismaClientId !== CLIENT_ID ||
    typeof (client as { listingLead?: { findMany?: unknown } }).listingLead?.findMany !== "function"
  );
}

if (globalForPrisma.prisma && clientIsStale(globalForPrisma.prisma)) {
  void globalForPrisma.prisma.$disconnect().catch(() => undefined);
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaClientId = CLIENT_ID;
}
