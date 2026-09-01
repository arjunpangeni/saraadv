import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDeskRole } from "@/lib/rbac";

/** Desk staff skip KYC. Everyone else — including sellers — must be verified to act as a buyer. */
export function requiresInvestorVerification(role: Role | undefined | null): boolean {
  if (!role) return true;
  return !isDeskRole(role);
}

export async function isVerifiedInvestor(userId: string, role: Role): Promise<boolean> {
  if (isDeskRole(role)) return true;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { verified: true } });
  return Boolean(user?.verified);
}

export function investorVerificationMessage(_role?: Role): string {
  return "Your investor profile must be verified by SARA Advisors before accessing confidential deal data. Please contact the deal desk or wait for approval.";
}

/** Owner and desk can open a listing without investor KYC. All other roles need verification. */
export async function canAccessConfidentialListing(
  userId: string,
  role: Role,
  listingOwnerId: string
): Promise<boolean> {
  if (isDeskRole(role)) return true;
  if (userId === listingOwnerId) return true;
  return isVerifiedInvestor(userId, role);
}
