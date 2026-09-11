import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const SITE_OFFICE = {
  name: siteConfig.name,
  street: "Muktinath Bikas Bank Building, 5th Floor",
  streetLine: "Bank Road, Kamaladi",
  locality: "Kathmandu",
  postalCode: "44600",
  region: "Bagmati",
  country: "NP",
  countryName: "Nepal",
  email: "advisor@asarpartners.com",
  phone: "+977 9840280094",
  phoneTel: "+9779840280094",
  hours: "Sunday–Friday, 10:00–17:00 NPT",
  lat: 27.710029937931804,
  lng: 85.32077703956494,
} as const;

export const SITE_OFFICE_LINES = [
  SITE_OFFICE.street,
  SITE_OFFICE.streetLine,
  `${SITE_OFFICE.locality} ${SITE_OFFICE.postalCode}`,
  `${SITE_OFFICE.region} Province, ${SITE_OFFICE.countryName}`,
] as const;

export function googleMapsEmbedSrc() {
  return `https://www.google.com/maps?q=${SITE_OFFICE.lat},${SITE_OFFICE.lng}&hl=en&z=17&output=embed`;
}

export function googleMapsDirectionsUrl() {
  return `https://www.google.com/maps/search/?api=1&query=${SITE_OFFICE.lat},${SITE_OFFICE.lng}`;
}

export function ogImage(alt: string) {
  return {
    url: siteConfig.ogImage,
    width: 1200,
    height: 630,
    alt,
  };
}

export function pageMetadata({
  title,
  description,
  path,
  keywords,
  ogTitle,
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  ogTitle?: string;
}): Metadata {
  const socialTitle = ogTitle ?? title;
  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: path },
    openGraph: {
      title: socialTitle,
      description,
      url: path,
      type: "website",
      images: [ogImage(socialTitle)],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [siteConfig.ogImage],
    },
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["ProfessionalService", "LocalBusiness"],
    name: siteConfig.name,
    legalName: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo2.png`,
    sameAs: Object.values(siteConfig.links.social),
    image: `${siteConfig.url}${siteConfig.ogImage}`,
    description: siteConfig.description,
    slogan: siteConfig.tagline,
    email: SITE_OFFICE.email,
    telephone: SITE_OFFICE.phoneTel,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${SITE_OFFICE.street}, ${SITE_OFFICE.streetLine}`,
      addressLocality: SITE_OFFICE.locality,
      postalCode: SITE_OFFICE.postalCode,
      addressRegion: SITE_OFFICE.region,
      addressCountry: SITE_OFFICE.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: SITE_OFFICE.lat,
      longitude: SITE_OFFICE.lng,
    },
    areaServed: {
      "@type": "Country",
      name: SITE_OFFICE.countryName,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: SITE_OFFICE.email,
      telephone: SITE_OFFICE.phoneTel,
      url: `${siteConfig.url}/contact`,
      availableLanguage: ["English", "Nepali"],
    },
    knowsAbout: [
      "Foreign Direct Investment Nepal",
      "Company registration Nepal",
      "Mergers and acquisitions",
      "Business brokerage",
      "Asset restructuring",
      "Carbon finance",
      "Investment matchmaking",
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; href?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.href ? { item: `${siteConfig.url}${item.href === "/" ? "" : item.href}` } : {}),
    })),
  };
}

export function itemListJsonLd({
  name,
  description,
  path,
  items,
}: {
  name: string;
  description: string;
  path: string;
  items: { name: string; url: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    description,
    url: `${siteConfig.url}${path}`,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}
