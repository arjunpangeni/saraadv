import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const LISTING_LEAD_COOKIE = "sara_listing_lead";
export const LISTING_LEAD_SESSION_MAX_AGE_SEC = 24 * 60 * 60;

type CookiePayload = {
  email: string;
  name: string;
  exp: number;
};

export type ListingLeadPrefill = {
  name: string;
  firm: string;
  email: string;
  phone: string;
  investorType?: string;
  investmentTimeframe?: string;
};

export type ListingLeadContext =
  | { remembered: false }
  | {
      remembered: true;
      requested: boolean;
      email: string;
      name: string;
      prefill: ListingLeadPrefill;
    };

function cookieSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required for listing lead sessions.");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", cookieSecret()).update(value).digest("base64url");
}

export function encodeListingLeadSession(input: { email: string; name: string }) {
  const payload = JSON.stringify({
    email: input.email.trim().toLowerCase(),
    name: input.name.trim(),
    exp: Date.now() + LISTING_LEAD_SESSION_MAX_AGE_SEC * 1000,
  } satisfies CookiePayload);
  const body = Buffer.from(payload).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeListingLeadSession(raw: string | undefined | null) {
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!body || !sig) return null;

  const expected = sign(body);
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as CookiePayload;
    if (!data.email || typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return { email: data.email, name: data.name ?? "" };
  } catch {
    return null;
  }
}

export async function setListingLeadSessionCookie(input: { email: string; name: string }) {
  const jar = await cookies();
  jar.set(LISTING_LEAD_COOKIE, encodeListingLeadSession(input), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: LISTING_LEAD_SESSION_MAX_AGE_SEC,
  });
}

export async function readListingLeadSession() {
  const jar = await cookies();
  return decodeListingLeadSession(jar.get(LISTING_LEAD_COOKIE)?.value);
}

export async function getListingLeadContext(listingId: string): Promise<ListingLeadContext> {
  const session = await readListingLeadSession();
  if (!session) return { remembered: false };

  const [thisLead, profile] = await Promise.all([
    prisma.listingLead.findUnique({
      where: { listingId_email: { listingId, email: session.email } },
      select: {
        isEmailVerified: true,
        name: true,
        firm: true,
        phone: true,
        investorType: true,
        investmentTimeframe: true,
      },
    }),
    prisma.listingLead.findFirst({
      where: { email: session.email, isEmailVerified: true },
      orderBy: { createdAt: "desc" },
      select: {
        name: true,
        firm: true,
        phone: true,
        investorType: true,
        investmentTimeframe: true,
      },
    }),
  ]);

  const name = thisLead?.name || profile?.name || session.name;
  return {
    remembered: true,
    requested: Boolean(thisLead?.isEmailVerified),
    email: session.email,
    name,
    prefill: {
      name,
      firm: thisLead?.firm || profile?.firm || "",
      email: session.email,
      phone: thisLead?.phone || profile?.phone || "",
      investorType: thisLead?.investorType ?? profile?.investorType,
      investmentTimeframe: thisLead?.investmentTimeframe ?? profile?.investmentTimeframe,
    },
  };
}
