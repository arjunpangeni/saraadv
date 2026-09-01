import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can, isDeskRole, type Permission } from "@/lib/rbac";

export async function requireSession(callbackUrl?: string) {
  const session = await auth();
  if (!session?.user) {
    const next = callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : "";
    redirect(`/login${next}`);
  }
  return session as NonNullable<typeof session>;
}

export { isDeskRole };

export async function requireDesk(callbackUrl = "/advisor") {
  const session = await requireSession(callbackUrl);
  if (!isDeskRole(session.user.role)) redirect("/dashboard?reason=forbidden");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession("/admin/analytics");
  if (session.user.role !== "ADMIN") redirect("/dashboard?reason=forbidden");
  return session;
}

export async function requirePermission(permission: Permission, callbackUrl?: string) {
  const session = await requireSession(callbackUrl);
  if (!can(session.user.role, permission)) redirect("/dashboard?reason=forbidden");
  return session;
}
