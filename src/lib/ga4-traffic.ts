import { createSign } from "crypto";
import type { AnalyticsRange } from "@/lib/analytics";

export type Ga4Traffic =
  | { status: "unconfigured" }
  | {
      status: "ok";
      liveUsers: number;
      sessions: number;
      pageViews: number;
      fetchedAt: string;
    }
  | { status: "error"; message: string };

const CACHE_MS = 2 * 60 * 1000;
const TOKEN_CACHE_MS = 50 * 60 * 1000;

const trafficCache = new Map<AnalyticsRange, { at: number; value: Ga4Traffic }>();
let tokenCache: { at: number; token: string } | null = null;

function ga4DateRange(range: AnalyticsRange) {
  if (range === "30d") return { startDate: "30daysAgo", endDate: "today" };
  if (range === "all") return { startDate: "2015-08-14", endDate: "today" };
  return { startDate: "7daysAgo", endDate: "today" };
}

function propertyId() {
  const raw = process.env.GA4_PROPERTY_ID?.trim() ?? "";
  if (!raw) return "";
  return raw.replace(/^properties\//, "");
}

function serviceAccount() {
  const json = process.env.GA4_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    try {
      const parsed = JSON.parse(json) as { client_email?: string; private_key?: string };
      if (parsed.client_email && parsed.private_key) {
        return { email: parsed.client_email, privateKey: parsed.private_key.replace(/\\n/g, "\n") };
      }
    } catch {
      return null;
    }
  }

  const email = process.env.GA4_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (email && privateKey) return { email, privateKey };
  return null;
}

export function ga4ReportingConfigured() {
  return Boolean(propertyId() && serviceAccount());
}

function signJwt(email: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    iss: email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  return `${unsigned}.${signer.sign(privateKey, "base64url")}`;
}

async function accessToken() {
  if (tokenCache && Date.now() - tokenCache.at < TOKEN_CACHE_MS) return tokenCache.token;
  const account = serviceAccount();
  if (!account) throw new Error("GA4 service account is not configured.");

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: signJwt(account.email, account.privateKey),
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; error_description?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || "Unable to authenticate with Google Analytics.");
  }
  tokenCache = { at: Date.now(), token: data.access_token };
  return data.access_token;
}

async function ga4Post<T>(path: string, payload: unknown): Promise<T> {
  const token = await accessToken();
  const id = propertyId();
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${id}:${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(data.error?.message || `Google Analytics request failed (${res.status}).`);
  }
  return data;
}

function metricValue(row: { metricValues?: { value?: string }[] } | undefined, index = 0) {
  const raw = row?.metricValues?.[index]?.value;
  const n = Number(raw ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function getGa4Traffic(range: AnalyticsRange = "7d"): Promise<Ga4Traffic> {
  if (!ga4ReportingConfigured()) return { status: "unconfigured" };
  const cached = trafficCache.get(range);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;

  try {
    const [realtime, totals] = await Promise.all([
      ga4Post<{ rows?: { metricValues?: { value?: string }[] }[] }>("runRealtimeReport", {
        metrics: [{ name: "activeUsers" }],
      }),
      ga4Post<{ rows?: { metricValues?: { value?: string }[] }[] }>("runReport", {
        dateRanges: [ga4DateRange(range)],
        metrics: [{ name: "sessions" }, { name: "screenPageViews" }],
      }),
    ]);

    const value: Ga4Traffic = {
      status: "ok",
      liveUsers: metricValue(realtime.rows?.[0]),
      sessions: metricValue(totals.rows?.[0], 0),
      pageViews: metricValue(totals.rows?.[0], 1),
      fetchedAt: new Date().toISOString(),
    };
    trafficCache.set(range, { at: Date.now(), value });
    return value;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to load Google Analytics.";
    console.error("[ga4] traffic fetch failed", message);
    const value: Ga4Traffic = { status: "error", message };
    trafficCache.set(range, { at: Date.now(), value });
    return value;
  }
}
