import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/start-a-business",
    "/buy-sell",
    "/asset-management",
    "/project-bank",
    "/carbon-finance",
    "/marketplace",
    "/project-bank/discover",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
  ].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));

  let listingRoutes: MetadataRoute.Sitemap = [];
  let projectRoutes: MetadataRoute.Sitemap = [];
  try {
    const [listings, projects] = await Promise.all([
      prisma.listing.findMany({
        where: { status: "PUBLISHED" },
        select: { hashId: true, updatedAt: true },
        take: 5000,
      }),
      prisma.projectListing.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
        take: 5000,
      }),
    ]);
    listingRoutes = listings.map((l) => ({
      url: `${siteConfig.url}/marketplace/${l.hashId}`,
      lastModified: l.updatedAt,
      changeFrequency: "daily",
      priority: 0.5,
    }));
    projectRoutes = projects.map((p) => ({
      url: `${siteConfig.url}/project-bank/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.5,
    }));
  } catch {
    // Database may be unavailable at build time - static routes still get emitted.
  }

  return [...staticRoutes, ...listingRoutes, ...projectRoutes];
}
