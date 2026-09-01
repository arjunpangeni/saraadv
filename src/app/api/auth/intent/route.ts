import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { AUTH_INTENT_COOKIE, isSignupRole, safeCallbackUrl, type SignupRole } from "@/lib/auth-utils";

const schema = z.object({
  role: z.string().optional(),
  callbackUrl: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const role = isSignupRole(parsed.data.role ?? "") ? (parsed.data.role as SignupRole) : undefined;
  const callbackUrl = safeCallbackUrl(parsed.data.callbackUrl);
  const jar = await cookies();
  jar.set(AUTH_INTENT_COOKIE, JSON.stringify({ role, callbackUrl }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 15 * 60,
  });

  return NextResponse.json({ ok: true, callbackUrl });
}
