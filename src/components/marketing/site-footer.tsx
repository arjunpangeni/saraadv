import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { SITE_OFFICE, googleMapsDirectionsUrl } from "@/lib/seo";
import { MARKETING_PLATFORM_LINKS, MARKETING_SERVICES } from "@/lib/marketing-nav";
import { SocialIcons } from "@/components/marketing/social-icons";
import { BackToTop } from "@/components/marketing/back-to-top";

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

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[11px] font-semibold tracking-[0.18em] text-foreground uppercase">
      {children}
    </p>
  );
}

function FooterTagline() {
  return (
    <p className="max-w-sm text-sm leading-relaxed text-muted-foreground after:mx-auto after:mt-4 after:block after:h-px after:w-16 after:bg-foreground/25 after:content-[''] lg:after:mx-0">
      End-to-end corporate, investment, and strategic consulting in Nepal.
    </p>
  );
}

function FooterOffice({ align = "left" }: { align?: "left" | "center" }) {
  const centered = align === "center";
  return (
    <div className={centered ? "text-center" : undefined}>
      <FooterHeading>Office</FooterHeading>
      <div className={centered ? "mx-auto flex max-w-xs items-start justify-center gap-2.5 text-left" : "flex items-start gap-2.5"}>
        <MapPin className="mt-0.5 size-4 shrink-0 text-tz-green-deep" aria-hidden />
        <address className="text-sm leading-relaxed text-muted-foreground not-italic">
          {SITE_OFFICE.street}
          <br />
          {SITE_OFFICE.streetLine}
          <br />
          {SITE_OFFICE.locality}
        </address>
      </div>
      <a
        href={googleMapsDirectionsUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className={
          centered
            ? "mt-3 inline-flex items-center justify-center gap-1 text-sm font-medium text-foreground"
            : "mt-3 inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-foreground/75"
        }
      >
        Directions
        <ArrowUpRight className="size-3.5" aria-hidden />
      </a>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center text-sm text-muted-foreground transition-colors hover:text-foreground lg:min-h-9"
    >
      {children}
    </Link>
  );
}

function MobileFooter() {
  return (
    <div className="flex flex-col items-center text-center lg:hidden">
      <FooterTagline />
      <SocialIcons className="mt-5 justify-center" />

      <div className="mt-6 flex w-full flex-col items-center gap-3 text-sm">
        <FooterOffice align="center" />
        <a href={`mailto:${SITE_OFFICE.email}`} className="break-all text-foreground">
          {SITE_OFFICE.email}
        </a>
        <a href={`tel:${SITE_OFFICE.phoneTel}`} className="text-foreground">
          {SITE_OFFICE.phone}
        </a>
      </div>

      <nav aria-label="Footer" className="mt-8 grid w-full max-w-sm grid-cols-2 gap-8">
        {MOBILE_LINK_GROUPS.map((group) => (
          <div key={group.title}>
            <FooterHeading>{group.title}</FooterHeading>
            <ul className="space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <BackToTop />
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-border/60 bg-card lg:bg-card/80">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--tz-pink-deep),var(--tz-blue-deep),var(--tz-green-deep),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-16 hidden size-56 rounded-full bg-tz-pink-deep/15 blur-3xl lg:block dark:bg-[#c45d84]/28"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-10 hidden size-52 rounded-full bg-tz-blue-deep/15 blur-3xl lg:block dark:bg-[#3b9ad9]/26"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 hidden h-40 w-[min(36rem,80%)] -translate-x-1/2 rounded-full bg-tz-green-deep/12 blur-3xl lg:block dark:bg-[#2f9e70]/24"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 right-1/4 hidden size-40 rounded-full bg-tz-gold/15 blur-3xl lg:block dark:bg-[#e8c36a]/18"
      />

      <div className="container-page relative py-14 sm:py-16">
        <MobileFooter />

        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <FooterTagline />
            <SocialIcons className="mt-5" />
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={`mailto:${SITE_OFFICE.email}`}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Mail className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{SITE_OFFICE.email}</span>
              </a>
              <a
                href={`tel:${SITE_OFFICE.phoneTel}`}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Phone className="size-4 shrink-0" aria-hidden />
                {SITE_OFFICE.phone}
              </a>
            </div>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-3 gap-x-8 lg:col-span-5">
            {LINK_GROUPS.map((group) => (
              <div key={group.title}>
                <FooterHeading>{group.title}</FooterHeading>
                <ul className="space-y-0.5">
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
            <FooterOffice />
          </div>
        </div>
      </div>

      <div className="relative border-t border-border/60">
        <div className="container-page flex flex-col items-center gap-1 py-4 text-center text-xs font-medium tracking-tight text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-left lg:py-5">
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
