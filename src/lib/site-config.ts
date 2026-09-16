export const siteConfig = {
  name: "ASAR Partners",
  tagline: "Invest. Reinvest. Disinvest.",
  description:
    "ASAR Partners is a premier business consulting and advisory firm providing end-to-end corporate, investment, and strategic consulting in Nepal - company formation, M&A brokerage, asset revival, investment matchmaking, and carbon finance.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ogImage: "/opengraph-image",
  links: {
    marketplace: "/marketplace",
    projectBank: "/project-bank",
    social: {
      instagram: "https://www.instagram.com/asarpartners",
      facebook: "https://www.facebook.com/asarpartners",
      linkedin: "https://www.linkedin.com/company/asar-partners",
      x: "https://x.com/asarpartners",
    },
  },
};

export type SiteConfig = typeof siteConfig;
