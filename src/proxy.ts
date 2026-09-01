import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { publicRequestOrigin } from "@/lib/auth-utils";

const PROTECTED_ROUTES: { prefix: string; roles: string[] }[] = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/advisor", roles: ["ADVISOR", "ADMIN"] },
  { prefix: "/sell", roles: ["SELLER", "ADVISOR", "ADMIN"] },
  { prefix: "/project-bank/new", roles: ["ENTREPRENEUR", "ADVISOR", "ADMIN"] },
  {
    prefix: "/dashboard",
    roles: ["SELLER", "BUYER", "ADVISOR", "ADMIN", "ENTREPRENEUR", "INVESTOR"],
  },
];

const UNLOCK_ROLES = ["SELLER", "BUYER", "ADVISOR", "ADMIN", "ENTREPRENEUR", "INVESTOR"];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const origin = publicRequestOrigin(req);

  if (pathname.includes("/marketplace/") && pathname.endsWith("/unlock")) {
    const role = req.auth?.user?.role;
    if (!role || !UNLOCK_ROLES.includes(role)) {
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin/analytics")) {
    const role = req.auth?.user?.role;
    if (!role || !["ADVISOR", "ADMIN"].includes(role)) {
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  const match = PROTECTED_ROUTES.find((r) => pathname.startsWith(r.prefix));
  if (!match) return NextResponse.next();

  const role = req.auth?.user?.role;
  if (!role) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    if (pathname.startsWith("/sell")) loginUrl.searchParams.set("role", "SELLER");
    if (pathname.startsWith("/project-bank/new")) loginUrl.searchParams.set("role", "ENTREPRENEUR");
    return NextResponse.redirect(loginUrl);
  }

  if (!match.roles.includes(role)) {
    const dest = new URL("/dashboard", origin);
    dest.searchParams.set("reason", "role");
    dest.searchParams.set("from", pathname);
    return NextResponse.redirect(dest);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/advisor/:path*",
    "/sell/:path*",
    "/project-bank/new",
    "/dashboard",
    "/dashboard/:path*",
    "/marketplace/:path*",
  ],
};
