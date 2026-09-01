import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/advisor",
          "/dashboard",
          "/api",
          "/login",
          "/register",
          "/onboarding",
          "/verify-email",
          "/auth",
          "/sell",
          "/project-bank/new",
          "/*/dossier",
          "/marketplace/*/unlock",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
