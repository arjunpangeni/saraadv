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
      instagram: "https://www.instagram.com/saraadvisors",
      facebook: "https://www.facebook.com/saraadvisors",
      linkedin: "https://www.linkedin.com/company/sara-advisors",
      x: "https://x.com/saraadvisors",
    },
  },
};

export type SiteConfig = typeof siteConfig;
