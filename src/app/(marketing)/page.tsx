import Link from "next/link";
import type { Metadata } from "next";
import { Building2, Globe, Scale, Shield } from "lucide-react";
import { SaraHeroGrid } from "@/components/marketing/sara-hero-grid";
import { HomeServiceCards } from "@/components/marketing/home-service-cards";
import { SectionHeading } from "@/components/marketing/section-heading";
import { siteConfig } from "@/lib/site-config";
import { LogoMarquee } from "@/components/smoothui/logo-cloud-3";
import SmoothButton from "@/components/smoothui/smooth-button";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: `${siteConfig.name} - End-to-End Corporate, Investment & Strategic Consulting`,
  description: siteConfig.description,
  path: "/",
  ogTitle: `${siteConfig.name} | ${siteConfig.tagline}`,
});

const TRUST_SIGNALS = [
  { icon: Globe, title: "Single Window", desc: "Legal, financial, and operational advisory centralized." },
  { icon: Scale, title: "Regulatory Mastery", desc: "Deep expertise in DOI, OCR, NRB, IRD, and SSF frameworks." },
  { icon: Shield, title: "Absolute Confidentiality", desc: "M&A and investor matchmaking with strict discretion." },
  { icon: Building2, title: "FDI Ready", desc: "Proven pathways for full capital repatriation compliance." },
];

const CREDENTIALS = [
  "Department of Industry",
  "Office of the Company Registrar",
  "Nepal Rastra Bank",
  "Inland Revenue Department",
  "Social Security Fund",
  "Verified Carbon Standard",
  "Gold Standard",
];

export default function HomePage() {
  return (
    <main className="flex-1">
        <SaraHeroGrid />

        <LogoMarquee
          speed="slow"
          logos={CREDENTIALS.map((name) => ({
            name,
            logo: (
              <span className="whitespace-nowrap text-sm font-medium tracking-tight text-foreground/70">
                {name}
              </span>
            ),
          }))}
        />

        <section className="container-page py-20 sm:py-28">
          <SectionHeading
            eyebrow="What we do"
            title="Advisory across the full investment lifecycle"
            description="From corporate formation and asset revival, to mergers, acquisitions, investment matchmaking, and sustainability finance."
            align="center"
            className="mb-12 sm:mb-14"
          />
          <HomeServiceCards />
        </section>

        <section className="border-y border-border/60 bg-card/50 py-20 sm:py-24">
          <div className="container-page">
            <SectionHeading
              eyebrow="Why ASAR"
              title="Built for Nepal's regulatory and investment landscape"
              description="Deep local expertise with institutional-grade process and discretion."
              align="center"
              className="mb-12 sm:mb-14"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TRUST_SIGNALS.map((t) => (
                <article
                  key={t.title}
                  className="h-full rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-card-hover)]"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-tz-green text-tz-green-deep">
                    <t.icon className="h-[1.125rem] w-[1.125rem]" aria-hidden />
                  </div>
                  <h3 className="heading-soft text-pretty font-heading text-xl font-semibold tracking-[-0.015em] text-foreground">
                    {t.title}
                  </h3>
                  <p className="mt-2.5 text-pretty text-[1.05rem] leading-[1.75] text-muted-foreground">{t.desc}</p>
                </article>
              ))}
            </div>
          </div>
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
                <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-tz-blue-deep uppercase">
                  Next step
                </p>
                <h2 className="heading-soft text-pretty font-heading text-[1.7rem] font-semibold tracking-[-0.015em] sm:text-[2rem] md:text-[2.35rem]">
                  Ready to start a business in Nepal?
                </h2>
                <p className="mt-4 text-[1.05rem] leading-[1.75] text-muted-foreground">
                  FDI approval, OCR registration, tax, banking, and licences — one intake, no login required.
                  The ASAR team follows up after you submit.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                <SmoothButton asChild size="lg" variant="candy" className="w-full sm:w-auto">
                  <Link href="/start-a-business/wizard#inquiry-form">Submit a setup inquiry</Link>
                </SmoothButton>
                <SmoothButton asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link href="/start-a-business">How setup works</Link>
                </SmoothButton>
              </div>
            </div>
          </div>
        </section>
      </main>
  );
}
