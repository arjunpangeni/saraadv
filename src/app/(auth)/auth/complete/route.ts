import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AUTH_INTENT_COOKIE,
  hasUsablePhone,
  isSignupRole,
  profileOnboardingPath,
  publicRequestOrigin,
  roleOnboardingPath,
  safeCallbackUrl,
} from "@/lib/auth-utils";
import { isDeskRole } from "@/lib/rbac";

export async function GET(req: Request) {
  const session = await auth();
  const origin = publicRequestOrigin(req);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const incoming = new URL(req.url);
  const jar = await cookies();
  let intentRole: string | undefined;
  let intentCallback: string | undefined;
  try {
    const raw = jar.get(AUTH_INTENT_COOKIE)?.value;
    if (raw) {
      const parsed = JSON.parse(raw) as { role?: string; callbackUrl?: string };
      intentRole = parsed.role;
      intentCallback = parsed.callbackUrl;
    }
  } catch {
    /* ignore */
  }
  jar.delete(AUTH_INTENT_COOKIE);

  const callbackUrl = safeCallbackUrl(incoming.searchParams.get("callbackUrl") || intentCallback);
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, createdAt: true, phone: true },
  });

  if (!user) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  let role = user.role;
  const fresh = Date.now() - user.createdAt.getTime() < 15 * 60 * 1000;
  const unassigned = role === "BUYER" || role === "INVESTOR";

  if (isSignupRole(intentRole) && unassigned && fresh) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: intentRole },
    });
    role = intentRole;
  } else if (unassigned && fresh && !isSignupRole(intentRole)) {
    return NextResponse.redirect(new URL(roleOnboardingPath(callbackUrl), origin));
  }

  if (!isDeskRole(role) && !hasUsablePhone(user.phone)) {
    return NextResponse.redirect(new URL(profileOnboardingPath(callbackUrl), origin));
  }

  return NextResponse.redirect(new URL(`/auth/sync?callbackUrl=${encodeURIComponent(callbackUrl)}`, origin));
}
