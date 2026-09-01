import Link from "next/link";
import { ArrowUp, ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { siteConfig } from "@/lib/site-config";
import { SITE_OFFICE, SITE_OFFICE_LINES, googleMapsDirectionsUrl } from "@/lib/seo";
import { MARKETING_PLATFORM_LINKS, MARKETING_SERVICES } from "@/lib/marketing-nav";

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

const LINK_GROUPS = [
  { title: "Services", links: MARKETING_SERVICES },
  { title: "Platform", links: MARKETING_PLATFORM_LINKS },
  { title: "Company", links: COMPANY_LINKS },
] as const;

const MOBILE_LINK_GROUPS = [
  { title: "Services", links: MARKETING_SERVICES },
  { title: "Company", links: COMPANY_LINKS },
] as const;

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center text-sm text-white/65 transition-colors hover:text-white lg:min-h-9"
    >
      {children}
    </Link>
  );
}

function MobileFooter() {
  return (
    <div className="flex flex-col items-center text-center lg:hidden">
      <BrandLogo invertOnDarkPanel showTagline />
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
        End-to-end corporate, investment, and strategic consulting in Nepal.
      </p>

      <div className="mt-6 space-y-2.5 text-sm">
        <address className="leading-relaxed text-white/80 not-italic">
          {SITE_OFFICE.street}
          <br />
          {SITE_OFFICE.streetLine}
          <br />
          {SITE_OFFICE.locality} {SITE_OFFICE.postalCode}
        </address>
        <p className="text-white/65">{SITE_OFFICE.hours}</p>
        <a href={`mailto:${SITE_OFFICE.email}`} className="block break-all text-white">
          {SITE_OFFICE.email}
        </a>
        <a href={`tel:${SITE_OFFICE.phoneTel}`} className="block text-white">
          {SITE_OFFICE.phone}
        </a>
        <a
          href={googleMapsDirectionsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1 font-medium text-white"
        >
          View on Google Maps
          <ArrowUpRight className="size-3.5" aria-hidden />
        </a>
      </div>

      <nav aria-label="Footer" className="mt-8 grid w-full max-w-sm grid-cols-2 gap-8">
        {MOBILE_LINK_GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="text-xs font-semibold tracking-[0.12em] text-white/45 uppercase">
              {group.title}
            </h3>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/70">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <a
        href="#main-content"
        className="mt-8 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-white"
      >
        Back to top
        <ArrowUp className="size-4" aria-hidden />
      </a>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-brand-solid text-white/70">
      <div className="container-page py-8 sm:py-10 lg:py-16">
        <MobileFooter />

        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <BrandLogo invertOnDarkPanel showTagline />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
              End-to-end corporate, investment, and strategic consulting in Nepal.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={`mailto:${SITE_OFFICE.email}`}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                <Mail className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{SITE_OFFICE.email}</span>
              </a>
              <a
                href={`tel:${SITE_OFFICE.phoneTel}`}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                <Phone className="size-4 shrink-0" aria-hidden />
                {SITE_OFFICE.phone}
              </a>
            </div>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-3 gap-x-8 lg:col-span-5">
            {LINK_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-semibold tracking-[0.12em] text-white/45 uppercase">
                  {group.title}
                </h3>
                <ul className="mt-3 space-y-0.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <FooterLink href={link.href}>{link.label}</FooterLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold tracking-[0.12em] text-white/45 uppercase">Office</h3>
            <p className="mt-3 text-sm font-medium text-white">{SITE_OFFICE.name}</p>
            <address className="mt-1 text-sm leading-relaxed whitespace-pre-line text-white/60 not-italic">
              {SITE_OFFICE_LINES.join("\n")}
            </address>
            <p className="mt-3 text-sm text-white/60">{SITE_OFFICE.hours}</p>
            <a
              href={googleMapsDirectionsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-white transition-colors hover:text-white/80"
            >
              <MapPin className="size-4 shrink-0" aria-hidden />
              View on Google Maps
              <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center gap-1 py-4 text-center text-xs font-medium tracking-tight text-white/45 sm:flex-row sm:items-center sm:justify-between sm:text-left lg:py-5">
          <p>
            &copy; {new Date().getFullYear()} {siteConfig.name}
          </p>
          <p className="hidden sm:block">
            {SITE_OFFICE.locality}, {SITE_OFFICE.region} Province, {SITE_OFFICE.countryName}
          </p>
        </div>
      </div>
    </footer>
  );
}
