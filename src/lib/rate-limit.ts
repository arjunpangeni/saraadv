const buckets = new Map<string, { count: number; resetAt: number }>();

const MAX_KEYS = 20_000;

function prune(now: number) {
  if (buckets.size < MAX_KEYS) return;
  for (const [key, entry] of buckets) {
    if (entry.resetAt < now) buckets.delete(key);
  }
  if (buckets.size >= MAX_KEYS) {
    const first = buckets.keys().next().value;
    if (first) buckets.delete(first);
  }
}

export function clientIp(req: Request): string {
  if (process.env.NODE_ENV !== "production") {
    return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 128) || "dev";
  }
  const trustProxy = process.env.AUTH_TRUST_PROXY === "true" || process.env.VERCEL === "1";
  if (!trustProxy) return "unknown";
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded.slice(0, 128);
  return "unknown";
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  prune(now);
  const entry = buckets.get(key);
  if (!entry || entry.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (entry.count >= limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }
  entry.count += 1;
  return { ok: true };
}

export function rateLimitResponse(retryAfter: number) {
  return {
    error: "Too many requests. Please try again shortly.",
    retryAfter,
  };
}
