import type { Role } from "@prisma/client";

/**
 * Role-Based Access Control (RBAC) policy for the SARA Advisors platform.
 *
 * Roles:
 *  - ADMIN        full access
 *  - ADVISOR      full profile access, CRM, all deal-flow data
 *  - SELLER       manage own Buy/Sell listings
 *  - BUYER        browse anonymized marketplace; gated full-profile access
 *                 requires a signed NdaAgreement (checked separately, not by role)
 *  - ENTREPRENEUR manage own Project Bank listings + Start a Business setups
 *  - INVESTOR     browse Project Bank; submit leads
 */

export const PERMISSIONS = {
  "listing:create": ["SELLER", "ADVISOR", "ADMIN"],
  "listing:manageOwn": ["SELLER", "ADVISOR", "ADMIN"],
  "listing:viewFull": ["ADVISOR", "ADMIN"], // buyers get full view only via NDA gate
  "crm:view": ["ADVISOR", "ADMIN"],
  "crm:manage": ["ADVISOR", "ADMIN"],
  "project:create": ["ENTREPRENEUR", "ADVISOR", "ADMIN"],
  "businessSetup:create": ["ENTREPRENEUR", "SELLER", "BUYER", "ADVISOR", "ADMIN"],
  "restructuring:manage": ["ADVISOR", "ADMIN"],
  "carbon:manage": ["ENTREPRENEUR", "SELLER", "ADVISOR", "ADMIN"],
  "admin:access": ["ADMIN"],
  "analytics:view": ["ADVISOR", "ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function isDeskRole(role: Role | string | undefined | null): role is "ADMIN" | "ADVISOR" {
  return role === "ADMIN" || role === "ADVISOR";
}

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export function assertCan(role: Role | undefined | null, permission: Permission) {
  if (!can(role, permission)) {
    throw new Error(`Forbidden: role "${role ?? "guest"}" lacks permission "${permission}"`);
  }
}
