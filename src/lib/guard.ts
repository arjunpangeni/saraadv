import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasUsablePhone, profileOnboardingPath } from "@/lib/auth-utils";
import { can, isDeskRole, type Permission } from "@/lib/rbac";

export async function requireSession(callbackUrl?: string) {
  const session = await auth();
  if (!session?.user) {
    const next = callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : "";
    redirect(`/login${next}`);
  }

  if (!isDeskRole(session.user.role)) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true },
    });
    if (!hasUsablePhone(user?.phone)) {
      const next = callbackUrl || "/dashboard";
      redirect(profileOnboardingPath(next));
    }
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
