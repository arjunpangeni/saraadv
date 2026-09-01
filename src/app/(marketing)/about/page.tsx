import type { Metadata } from "next";
import Link from "next/link";
import { FileCheck, Shield, Users } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { SectionHeading } from "@/components/marketing/section-heading";
import { JsonLd } from "@/components/json-ld";
import SmoothButton from "@/components/smoothui/smooth-button";
import { siteConfig } from "@/lib/site-config";
import { pageMetadata } from "@/lib/seo";
import { MARKETING_SERVICES } from "@/lib/marketing-nav";
import { SARA_TEAM } from "@/lib/team";

const DESCRIPTION =
  "SARA Advisors is a corporate and investment advisory firm — company formation, M&A, asset revival, Project Bank matchmaking, and carbon finance.";

const WHO = [
  {
    icon: FileCheck,
    title: "How we work",
    desc: "Intake, a documented process, and a named counterpart on every mandate.",
  },
  {
    icon: Users,
    title: "Who we advise",
    desc: "Founders, buyers, sellers, investors, and project owners across Nepal.",
  },
  {
    icon: Shield,
    title: "Discretion",
    desc: "Teasers stay anonymized until an NDA. The same standard on every desk.",
  },
] as const;

const PRACTICES: Record<(typeof MARKETING_SERVICES)[number]["href"], string> = {
  "/start-a-business": "Formation, FDI, and licences from one intake.",
  "/buy-sell": "Confidential buy-side and sell-side mandates.",
  "/asset-management": "Restructuring and revival of underperforming assets.",
  "/project-bank": "Project owners matched with capital.",
  "/carbon-finance": "Nepal carbon projects, buyers, and offtake.",
};

export const metadata: Metadata = pageMetadata({
  title: "About SARA Advisors",
  description: DESCRIPTION,
  path: "/about",
  ogTitle: "About SARA Advisors | Corporate & investment consulting",
});

export default function AboutPage() {
  return (
    <main className="flex-1">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About SARA Advisors",
          description: DESCRIPTION,
          url: `${siteConfig.url}/about`,
          isPartOf: { "@type": "WebSite", name: siteConfig.name, url: siteConfig.url },
          mainEntity: {
            "@type": "ProfessionalService",
            name: siteConfig.name,
            employee: SARA_TEAM.map((member) => ({
              "@type": "Person",
              name: member.name,
              jobTitle: member.credentialLabel,
              description: member.focus,
            })),
          },
        }}
      />

      <PageHero
        eyebrow="About"
        title="About SARA Advisors"
        description="A single-window advisory firm for the full investment lifecycle — form a company, buy or sell one, revive an asset, raise capital, or monetise carbon."
        compact
      />

      <section className="container-page py-20 sm:py-28">
        <SectionHeading
          eyebrow="Who we are"
          title="Built for Nepal’s regulatory and investment landscape"
          description="FDI, OCR, NRB, IRD, and sector licences are part of the mandate — not a problem that appears after the deal. One desk runs corporate setup, confidential M&A, asset revival, Project Bank, and carbon."
          align="center"
          className="mb-12 sm:mb-14"
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {WHO.map((item) => (
            <article
              key={item.title}
              className="h-full rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-brand-sky-muted text-brand-sky">
                <item.icon className="h-[1.125rem] w-[1.125rem]" aria-hidden />
              </div>
              <h3 className="text-pretty font-display text-2xl font-extrabold tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="mt-2.5 text-pretty text-lg leading-relaxed text-foreground/70">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border-subtle bg-surface-muted/50 py-20 sm:py-28">
        <div className="container-page">
          <SectionHeading
            eyebrow="What we do"
            title="Advisory across the full investment lifecycle"
            description="Five practices. One process — scoped, documented, and confidential."
            align="center"
            className="mb-12 sm:mb-14"
          />
          <ul className="mx-auto max-w-3xl divide-y divide-border rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
            {MARKETING_SERVICES.map((service) => (
              <li key={service.href}>
                <Link
                  href={service.href}
                  className="flex flex-col gap-1 px-6 py-5 transition-colors hover:bg-surface-muted/60 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                >
                  <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
                    {service.label}
                  </span>
                  <span className="text-lg leading-relaxed text-foreground/70 sm:text-right">
                    {PRACTICES[service.href]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page py-20 sm:py-28">
        <SectionHeading
          eyebrow="Our team"
          title="The people on the desk"
          description="The strength of SARA Advisors lies in our team of financial experts and strategists."
          align="center"
          className="mb-12 sm:mb-14"
        />
        <ul className="grid gap-4 lg:grid-cols-2">
          {SARA_TEAM.map((member) => (
            <li key={member.name}>
              <article className="h-full rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
                <h3 className="text-pretty font-display text-2xl font-extrabold tracking-tight text-foreground">
                  {member.name}
                </h3>
                <p className="mt-1 text-sm font-medium tracking-tight text-brand-sky">
                  {member.credential} · {member.credentialLabel}
                </p>
                <p className="mt-1 text-sm font-medium tracking-tight text-foreground/55">{member.focus}</p>
                <p className="mt-4 text-pretty text-lg leading-relaxed text-foreground/70">{member.bio}</p>
              </article>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page pb-20 sm:pb-24">
        <div className="relative overflow-hidden rounded-2xl border border-border-subtle bg-brand-solid px-6 py-12 text-white sm:px-12 sm:py-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(ellipse 70% 80% at 100% 0%, rgb(80 152 208 / 0.4) 0%, transparent 55%)",
            }}
            aria-hidden
          />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_auto] lg:items-end">
            <div className="max-w-xl">
              <p className="mb-4 text-sm font-medium tracking-tight text-white/80">Next step</p>
              <h2 className="text-pretty font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Start a conversation
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-white/70">
                Formation, a transaction, a distressed asset, a project, or carbon. The desk follows up
                by message or call.
              </p>
            </div>
            <SmoothButton asChild size="lg" variant="candy" className="w-full sm:w-auto">
              <Link href="/contact">Contact SARA Advisors</Link>
            </SmoothButton>
          </div>
        </div>
      </section>
    </main>
  );
}
