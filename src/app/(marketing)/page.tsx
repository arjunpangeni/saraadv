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

        <section className="border-y border-border-subtle bg-surface-muted/50 py-20 sm:py-24">
          <div className="container-page">
            <SectionHeading
              eyebrow="Why SARA"
              title="Built for Nepal's regulatory and investment landscape"
              description="Deep local expertise with institutional-grade process and discretion."
              align="center"
              className="mb-12 sm:mb-14"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TRUST_SIGNALS.map((t) => (
                <article
                  key={t.title}
                  className="h-full rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-[var(--shadow-card-hover)]"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-brand-sky-muted text-brand-sky">
                    <t.icon className="h-[1.125rem] w-[1.125rem]" aria-hidden />
                  </div>
                  <h3 className="text-pretty font-display text-2xl font-extrabold tracking-tight text-foreground">
                    {t.title}
                  </h3>
                  <p className="mt-2.5 text-pretty text-lg leading-relaxed text-foreground/70">{t.desc}</p>
                </article>
              ))}
            </div>
          </div>
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
                <p className="mb-4 text-sm font-medium tracking-tight text-white/80">
                  Next step
                </p>
                <h2 className="text-pretty font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Ready to start a business in Nepal?
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-white/70">
                  FDI approval, OCR registration, tax, banking, and licences — one intake, no login required.
                  The SARA team follows up after you submit.
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
