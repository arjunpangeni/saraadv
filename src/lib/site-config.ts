export const siteConfig = {
  name: "SARA Advisors",
  tagline: "Invest. Reinvest. Disinvest.",
  description:
    "SARA Advisors is a premier business consulting and advisory firm providing end-to-end corporate, investment, and strategic consulting in Nepal - company formation, M&A brokerage, asset revival, investment matchmaking, and carbon finance.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ogImage: "/opengraph-image",
  links: {
    marketplace: "/marketplace",
    projectBank: "/project-bank",
  },
};

export type SiteConfig = typeof siteConfig;
