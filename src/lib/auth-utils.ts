export const PUBLIC_ROLES = ["SELLER", "BUYER", "ENTREPRENEUR", "INVESTOR"] as const;
export type PublicRole = (typeof PUBLIC_ROLES)[number];

export const SIGNUP_ROLES = ["SELLER", "ENTREPRENEUR"] as const;
export type SignupRole = (typeof SIGNUP_ROLES)[number];

export const AUTH_INTENT_COOKIE = "asar-auth-intent";

export function isPublicRole(value: string | null | undefined): value is PublicRole {
  return PUBLIC_ROLES.includes(value as PublicRole);
}

export function isSignupRole(value: string | null | undefined): value is SignupRole {
  return SIGNUP_ROLES.includes(value as SignupRole);
}

function configuredSiteOrigin(): string | null {
  for (const raw of [process.env.AUTH_URL, process.env.NEXT_PUBLIC_SITE_URL]) {
    if (!raw?.trim()) continue;
    try {
      return new URL(raw).origin;
    } catch {
      /* ignore invalid */
    }
  }
  return null;
}

function trustedHosts(): Set<string> {
  const hosts = new Set<string>();
  const origin = configuredSiteOrigin();
  if (origin) hosts.add(new URL(origin).host.toLowerCase());
  for (const extra of (process.env.AUTH_TRUSTED_HOSTS ?? "").split(",")) {
    const host = extra.trim().toLowerCase();
    if (host) hosts.add(host);
  }
  return hosts;
}

/**
 * Origin for auth redirects. Production only accepts Host values on the allowlist
 * (AUTH_URL / NEXT_PUBLIC_SITE_URL / AUTH_TRUSTED_HOSTS). x-forwarded-host is ignored.
 */
export function publicRequestOrigin(req: Request): string {
  const url = new URL(req.url);
  const host = (req.headers.get("host") || url.host).split(",")[0].trim();
  const proto = (
    req.headers.get("x-forwarded-proto") ||
    url.protocol.replace(":", "")
  )
    .split(",")[0]
    .trim();
  const hostname = host.replace(/^\[|\]$/g, "").split(":")[0];
  const portPart = host.includes("]:")
    ? host.slice(host.lastIndexOf(":"))
    : host.includes(":") && !host.startsWith("[")
      ? host.slice(host.indexOf(":"))
      : "";

  if (process.env.NODE_ENV !== "production") {
    if (hostname === "0.0.0.0" || hostname === "::") {
      return `${proto}://localhost${portPart}`;
    }
    return `${proto}://${host}`;
  }

  const site = configuredSiteOrigin();
  const trusted = trustedHosts();
  if (trusted.size === 0) return site ?? `${proto}://${host}`;
  if (trusted.has(host.toLowerCase())) {
    const lockedProto = site ? new URL(site).protocol.replace(":", "") : proto;
    return `${lockedProto}://${host}`;
  }
  return site ?? `${proto}://${host}`;
}

export function safeCallbackUrl(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw) return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("\\")) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed);
    const base = new URL(process.env.AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
    if (url.origin === base.origin) {
      return `${url.pathname}${url.search}${url.hash}` || fallback;
    }
  } catch {
    /* ignore invalid URLs */
  }
  return fallback;
}

export function hasUsablePhone(phone: string | null | undefined): boolean {
  if (!phone?.trim()) return false;
  // Lazy import avoided — digits-only check mirrors normalizePhone without circular deps.
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function profileOnboardingPath(callbackUrl?: string | null): string {
  return `/onboarding/profile?callbackUrl=${encodeURIComponent(safeCallbackUrl(callbackUrl))}`;
}

export function roleOnboardingPath(callbackUrl?: string | null): string {
  return `/onboarding/role?callbackUrl=${encodeURIComponent(safeCallbackUrl(callbackUrl))}`;
}

export function authIntentFromCallback(callbackUrl: string): {
  title: string;
  subtitle: string;
  suggestedRole: SignupRole | null;
} {
  if (callbackUrl.startsWith("/sell")) {
    return {
      title: "Sign in to list your business",
      subtitle: "Seller accounts can submit an anonymized listing for the ASAR marketplace.",
      suggestedRole: "SELLER",
    };
  }
  if (callbackUrl.startsWith("/project-bank")) {
    return {
      title: "Sign in to list your project idea",
      subtitle: "Entrepreneur accounts can submit a Project Bank teaser for advisor review.",
      suggestedRole: "ENTREPRENEUR",
    };
  }
  return {
    title: "Welcome back",
    subtitle: "Sign in as a Seller or Project owner to list a business or a project idea.",
    suggestedRole: null,
  };
}

export function googleOAuthEnabled() {
  return Boolean(process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim());
}

export function suggestedRoleFromQuery(role: string | null, fallback: SignupRole | null): SignupRole {
  if (isSignupRole(role)) return role;
  if (isSignupRole(fallback)) return fallback;
  return "SELLER";
}

/** After signup, send each role to its matching start path when they would otherwise land on the dashboard. */
export function postAuthDestination(role: string | undefined, callbackUrl: string) {
  const next = safeCallbackUrl(callbackUrl);
  if (next !== "/dashboard") return next;
  if (role === "SELLER") return "/sell/new";
  if (role === "ENTREPRENEUR") return "/project-bank/new";
  return next;
}

/** Whether a signed-in role is allowed to open a protected callback path. */
export function roleCanAccessPath(role: string | undefined, path: string): boolean {
  if (!role) return false;
  if (path.startsWith("/admin")) return role === "ADMIN";
  if (path.startsWith("/advisor")) return role === "ADVISOR" || role === "ADMIN";
  if (path.startsWith("/sell")) return role === "SELLER" || role === "ADVISOR" || role === "ADMIN";
  if (path.startsWith("/project-bank/new")) {
    return role === "ENTREPRENEUR" || role === "ADVISOR" || role === "ADMIN";
  }
  return true;
}

/**
 * Safe landing path for an already-signed-in visitor on /login or /register.
 * Avoids redirect loops when callbackUrl points at a role-gated route.
 */
export function resolveSignedInDestination(role: string | undefined, callbackUrl?: string | null): string {
  const next = safeCallbackUrl(callbackUrl);
  if (roleCanAccessPath(role, next)) {
    return postAuthDestination(role, next);
  }
  if (!role || role === "BUYER" || role === "INVESTOR") {
    return roleOnboardingPath(next);
  }
  return `/dashboard?reason=role&from=${encodeURIComponent(next)}`;
}

/** After auth, send users who still need a phone to the profile gate. */
export function withPhoneGate(
  destination: string,
  opts: { phone?: string | null; role?: string | undefined; skipDesk?: boolean } = {}
): string {
  const role = opts.role;
  const isDesk = role === "ADMIN" || role === "ADVISOR";
  if (opts.skipDesk !== false && isDesk) return destination;
  if (hasUsablePhone(opts.phone)) return destination;
  // Don't nest the profile page inside itself.
  if (destination.startsWith("/onboarding/profile")) return destination;
  return profileOnboardingPath(destination);
}

/** Public marketing CTAs — go through auth instead of hitting protected routes directly. */
export const LIST_BUSINESS_HREF = "/register?role=SELLER&callbackUrl=/sell/new";
export const LIST_PROJECT_HREF = "/register?role=ENTREPRENEUR&callbackUrl=/project-bank/new";


export function oauthErrorMessage(code?: string | null) {
  if (!code) return null;
  if (code === "OAuthAccountNotLinked") {
    return "This email is already registered. Sign in with email, then you can link Google.";
  }
  if (code === "AccessDenied") return "Google sign-in was denied.";
  if (code === "Configuration") return "Google sign-in is not configured yet.";
  return "Sign-in failed. Try again or use email.";
}

export const ROLE_OPTIONS: { value: SignupRole; label: string; shortLabel: string; hint: string }[] = [
  {
    value: "SELLER",
    label: "Seller",
    shortLabel: "Seller",
    hint: "List an existing company for sale on the ASAR marketplace.",
  },
  {
    value: "ENTREPRENEUR",
    label: "Project owner",
    shortLabel: "Project owner",
    hint: "List a project idea in the Project Bank for investor discovery.",
  },
];

export function roleShortLabel(role: PublicRole): string {
  return ROLE_OPTIONS.find((option) => option.value === role)?.shortLabel ?? role;
}

export function googleContinueLabel(role: SignupRole): string {
  return `Continue with Google as ${roleShortLabel(role)}`;
}
