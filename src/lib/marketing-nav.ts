export const MARKETING_SERVICES = [
  { href: "/start-a-business", label: "Start a Business" },
  { href: "/buy-sell", label: "Buy / Sell" },
  { href: "/asset-management", label: "Asset Management" },
  { href: "/project-bank", label: "Project Bank" },
  { href: "/carbon-finance", label: "Carbon Finance" },
] as const;

export const MARKETING_PLATFORM_LINKS = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/project-bank/discover", label: "Project Bank" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/login", label: "Sign in" },
] as const;

export function isNavActive(pathname: string, href: string, match: "exact" | "prefix" = "prefix") {
  if (match === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
