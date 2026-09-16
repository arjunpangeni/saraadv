import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Production must allow 'unsafe-inline' for Next.js bootstrap scripts.
 * Do not mix script hashes/nonces here: when a hash or nonce is present,
 * browsers ignore 'unsafe-inline' and Next's inline scripts get blocked,
 * leaving Motion UI stuck at opacity: 0.
 *
 * For a stricter nonce-based CSP later, use proxy.ts per Next.js docs
 * (requires dynamic rendering on every page).
 */
const scriptSrc = [
  "script-src 'self' 'unsafe-inline'",
  ...(isDev ? ["'unsafe-eval'"] : []),
  "https://accounts.google.com",
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
].join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://accounts.google.com https://*.google.com https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://api.openai.com",
  "frame-src 'self' https://accounts.google.com https://www.google.com https://maps.google.com https://*.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const extraDevOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  allowedDevOrigins: ["192.168.1.3", "192.168.1.6", "172.29.192.1", ...extraDevOrigins],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
