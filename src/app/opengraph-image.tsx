import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function hostname() {
  try {
    return new URL(siteConfig.url).hostname;
  } catch {
    return "saraadvisors.com";
  }
}

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          background: "#003078",
          color: "white",
          padding: "64px 72px",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            background:
              "radial-gradient(ellipse 70% 80% at 100% 0%, rgba(80, 152, 208, 0.45) 0%, transparent 55%)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              letterSpacing: "0.22em",
              fontWeight: 700,
              color: "rgba(255,255,255,0.72)",
            }}
          >
            SARA ADVISORS
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.1,
              maxWidth: 980,
            }}
          >
            {siteConfig.tagline}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 920 }}>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              lineHeight: 1.35,
              color: "rgba(255,255,255,0.82)",
            }}
          >
            End-to-end corporate, investment, and strategic consulting in Nepal.
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,0.55)" }}>
            {hostname()}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
