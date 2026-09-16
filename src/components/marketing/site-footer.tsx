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

const DESKTOP_LINK_GROUPS = [
  { title: "Platform", links: MARKETING_PLATFORM_LINKS },
  { title: "Company", links: COMPANY_LINKS },
] as const;

const MOBILE_LINK_GROUPS = [
  { title: "Services", links: MARKETING_SERVICES },
  { title: "Company", links: COMPANY_LINKS },
] as const;

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-foreground uppercase">
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

function FooterOffice({
  align = "left",
  showDirections = true,
}: {
  align?: "left" | "center";
  showDirections?: boolean;
}) {
  const centered = align === "center";
  return (
    <div className={centered ? "text-center" : undefined}>
      <FooterHeading>Office</FooterHeading>
      <div
        className={
          centered
            ? "mx-auto flex max-w-sm items-start justify-center gap-3 text-left"
            : "flex items-start gap-3"
        }
      >
        <MapPin className="mt-1 size-4 shrink-0 text-tz-green-deep" aria-hidden />
        <address className="space-y-1.5 text-sm leading-6 text-muted-foreground not-italic">
          <span className="block text-foreground/90">{SITE_OFFICE.street}</span>
          <span className="block">{SITE_OFFICE.streetLine}</span>
          <span className="block">
            {SITE_OFFICE.locality} {SITE_OFFICE.postalCode}
          </span>
          <span className="block">
            {SITE_OFFICE.region} Province, {SITE_OFFICE.countryName}
          </span>
        </address>
      </div>
      {showDirections ? (
        <a
          href={googleMapsDirectionsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={
            centered
              ? "mt-4 inline-flex items-center justify-center gap-1 text-sm font-medium text-foreground"
              : "mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-foreground/75"
          }
        >
          Directions
          <ArrowUpRight className="size-3.5" aria-hidden />
        </a>
      ) : null}
    </div>
  );
}

function FooterContactRows() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
      <a
        href={googleMapsDirectionsUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <MapPin className="size-4 shrink-0 text-tz-green-deep" aria-hidden />
        <span className="font-medium text-foreground/80">Directions</span>
        <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
      </a>
      <a
        href={`mailto:${SITE_OFFICE.email}`}
        className="inline-flex min-w-0 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Mail className="size-4 shrink-0 text-tz-blue-deep" aria-hidden />
        <span className="font-medium text-foreground/80">Email</span>
        <span className="truncate">{SITE_OFFICE.email}</span>
      </a>
      <a
        href={`tel:${SITE_OFFICE.phoneTel}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Phone className="size-4 shrink-0 text-tz-pink-deep" aria-hidden />
        <span className="font-medium text-foreground/80">Phone</span>
        <span>{SITE_OFFICE.phone}</span>
      </a>
    </div>
  );
}

function FooterEmail({ align = "left" }: { align?: "left" | "center" }) {
  const centered = align === "center";
  return (
    <div className={centered ? "text-center" : undefined}>
      <FooterHeading>Email</FooterHeading>
      <a
        href={`mailto:${SITE_OFFICE.email}`}
        className={
          centered
            ? "inline-flex items-center justify-center gap-2 break-all text-sm text-muted-foreground transition-colors hover:text-foreground"
            : "inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        }
      >
        <Mail className="size-4 shrink-0 text-tz-blue-deep" aria-hidden />
        <span>{SITE_OFFICE.email}</span>
      </a>
    </div>
  );
}

function FooterPhone({ align = "left" }: { align?: "left" | "center" }) {
  const centered = align === "center";
  return (
    <div className={centered ? "text-center" : undefined}>
      <FooterHeading>Phone</FooterHeading>
      <a
        href={`tel:${SITE_OFFICE.phoneTel}`}
        className={
          centered
            ? "inline-flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            : "inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        }
      >
        <Phone className="size-4 shrink-0 text-tz-pink-deep" aria-hidden />
        <span>{SITE_OFFICE.phone}</span>
      </a>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center py-1 font-sans text-sm font-normal leading-snug tracking-normal text-muted-foreground transition-colors hover:text-foreground"
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

      <div className="mt-8 flex w-full max-w-sm flex-col items-center gap-7">
        <FooterOffice align="center" />
        <div className="h-px w-12 bg-border" aria-hidden />
        <FooterEmail align="center" />
        <div className="h-px w-12 bg-border" aria-hidden />
        <FooterPhone align="center" />
      </div>

      <nav aria-label="Footer" className="mt-10 grid w-full max-w-sm grid-cols-2 gap-8">
        {MOBILE_LINK_GROUPS.map((group) => (
          <div key={group.title}>
            <FooterHeading>{group.title}</FooterHeading>
            <ul className="space-y-1">
              {group.links.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
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

        <div className="hidden lg:block">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-4">
              <FooterTagline />
              <SocialIcons className="mt-5" />
            </div>

            <nav aria-label="Footer" className="col-span-5 grid grid-cols-2 gap-x-8">
              {DESKTOP_LINK_GROUPS.map((group) => (
                <div key={group.title}>
                  <FooterHeading>{group.title}</FooterHeading>
                  <ul className="space-y-1">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <FooterLink href={link.href}>{link.label}</FooterLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="col-span-3">
              <FooterOffice showDirections={false} />
            </div>
          </div>

          <div className="mt-8 border-t border-border/50 pt-6">
            <FooterContactRows />
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
