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
import { ASAR_TEAM } from "@/lib/team";

const DESCRIPTION =
  "ASAR Partners is a corporate and investment advisory firm — company formation, M&A, asset revival, Project Bank matchmaking, and carbon finance.";

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
  title: "About ASAR Partners",
  description: DESCRIPTION,
  path: "/about",
  ogTitle: "About ASAR Partners | Corporate & investment consulting",
});

export default function AboutPage() {
  return (
    <main className="flex-1">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About ASAR Partners",
          description: DESCRIPTION,
          url: `${siteConfig.url}/about`,
          isPartOf: { "@type": "WebSite", name: siteConfig.name, url: siteConfig.url },
          mainEntity: {
            "@type": "ProfessionalService",
            name: siteConfig.name,
            employee: ASAR_TEAM.map((member) => ({
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
        title="About ASAR Partners"
        description="A single-window advisory firm for the full investment lifecycle — form a company, buy or sell one, revive an asset, raise capital, or monetise carbon."
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
              className="h-full rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-tz-green text-tz-green-deep">
                <item.icon className="h-[1.125rem] w-[1.125rem]" aria-hidden />
              </div>
              <h3 className="heading-soft text-pretty font-heading text-xl font-semibold tracking-[-0.015em] text-foreground">
                {item.title}
              </h3>
              <p className="mt-2.5 text-pretty text-[1.05rem] leading-[1.75] text-muted-foreground">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/50 py-20 sm:py-28">
        <div className="container-page">
          <SectionHeading
            eyebrow="What we do"
            title="Advisory across the full investment lifecycle"
            description="Five practices. One process — scoped, documented, and confidential."
            align="center"
            className="mb-12 sm:mb-14"
          />
          <ul className="mx-auto max-w-3xl divide-y divide-border rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
            {MARKETING_SERVICES.map((service) => (
              <li key={service.href}>
                <Link
                  href={service.href}
                  className="flex flex-col gap-1 px-6 py-5 transition-colors hover:bg-surface-muted/60 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                >
                  <span className="heading-soft font-heading text-lg font-semibold tracking-[-0.015em] text-foreground">
                    {service.label}
                  </span>
                  <span className="text-[1.05rem] leading-[1.75] text-muted-foreground sm:text-right">
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
          description="The strength of ASAR Partners lies in our team of financial experts and strategists."
          align="center"
          className="mb-12 sm:mb-14"
        />
        <ul className="grid gap-4 lg:grid-cols-2">
          {ASAR_TEAM.map((member) => (
            <li key={member.name}>
              <article className="h-full rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
                <h3 className="heading-soft text-pretty font-heading text-xl font-semibold tracking-[-0.015em] text-foreground">
                  {member.name}
                </h3>
                <p className="mt-1 text-sm font-medium tracking-tight text-tz-blue-deep">
                  {member.credential} · {member.credentialLabel}
                </p>
                <p className="mt-1 text-sm font-medium tracking-tight text-foreground/55">{member.focus}</p>
                <p className="mt-4 text-pretty text-[1.05rem] leading-[1.75] text-muted-foreground">{member.bio}</p>
              </article>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page pb-20 sm:pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-12 sm:px-12 sm:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-10 hidden size-56 rounded-full bg-tz-green-deep/15 blur-3xl lg:block"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-10 hidden size-52 rounded-full bg-tz-pink-deep/12 blur-3xl lg:block"
          />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_auto] lg:items-end">
            <div className="max-w-xl">
              <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-tz-blue-deep uppercase">Next step</p>
              <h2 className="heading-soft text-pretty font-heading text-[1.7rem] font-semibold tracking-[-0.015em] sm:text-[2rem] md:text-[2.35rem]">
                Start a conversation
              </h2>
              <p className="mt-4 text-[1.05rem] leading-[1.75] text-muted-foreground">
                Formation, a transaction, a distressed asset, a project, or carbon. The desk follows up
                by message or call.
              </p>
            </div>
            <SmoothButton asChild size="lg" variant="candy" className="w-full sm:w-auto">
              <Link href="/contact">Contact ASAR Partners</Link>
            </SmoothButton>
          </div>
        </div>
      </section>
    </main>
  );
}
