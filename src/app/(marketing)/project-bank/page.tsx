import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Eye, Lock } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/marketing/page-hero";
import { SectionHeading } from "@/components/marketing/section-heading";
import { FaqList, type FaqItem } from "@/components/marketing/faq-list";
import SmoothButton from "@/components/smoothui/smooth-button";
import { ProjectBankAudience } from "@/components/project-bank/project-bank-audience";

export const metadata: Metadata = pageMetadata({
  title: "Investment Opportunities in Nepal - Project Bank",
  description:
    "SARA Advisors' Project Bank is a curated digital catalog bridging entrepreneurs with domestic and international investors seeking high-yield opportunities across Nepal.",
  path: "/project-bank",
  ogTitle: "Investment opportunities in Nepal | Project Bank",
});

const INTRO =
  "SARA Advisors curates a proprietary Project Bank - a living pipeline that serves as a bridge between visionary entrepreneurs requiring capital and investors seeking high-yield opportunities across Nepal's growing economy.";

const FAQ: FaqItem[] = [
  {
    question: "How is Project Bank different from the M&A marketplace?",
    answer:
      "The marketplace is for operating businesses that are for sale or seeking a partner. Project Bank is for concepts and projects that need capital — public teasers with CAPEX band, target IRR, and stage. The Vault (plans, models, exact location) is never published; SARA Advisors share it after vetting and an NDA.",
  },
  {
    question: "Is my intellectual property public if I list?",
    answer:
      "No. The live card shows an elevator pitch and high-level financials only. Detailed plans, models, founder contacts, and exact location live in an advisor-only Vault. Investors receive those files from SARA Advisors after an NDA — not on this website.",
  },
  {
    question: "Who can request a full dossier?",
    answer:
      "Investors and other qualified counterparties. Submit the form and confirm your work email with a magic link (no code). An advisor then vets the inquiry, arranges the NDA, and shares the Vault offline.",
  },
];

export default function ProjectBankPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "Investment Deal Flow & Matchmaking",
          name: `Investment opportunities in Nepal - ${siteConfig.name}`,
          description: INTRO,
          provider: {
            "@type": "Organization",
            name: siteConfig.name,
            url: siteConfig.url,
            logo: `${siteConfig.url}/logo2.png`,
          },
          areaServed: "NP",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />

      <main className="flex-1">
        <PageHero
          eyebrow="Investment Deal Flow & Matchmaking"
          title="Investment opportunities in Nepal"
          description={INTRO}
          tight
          cta={{ label: "Browse projects", href: "/project-bank/discover" }}
          secondaryCta={{ label: "List your idea", href: "/project-bank/new" }}
        />

        <section className="container-page py-8 sm:py-10">
          <SectionHeading
            eyebrow="Teaser & Gate"
            title="What investors see — and what stays protected"
            description="The public card is a teaser. The operational plan never goes online — SARA Advisors share it after vetting and an NDA."
            align="center"
            size="compact"
            className="mb-6"
          />

          <div className="mb-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
            <article className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand-sky">
                <Eye className="size-4" aria-hidden />
                Public teaser
              </div>
              <h2 className="mt-2 font-display text-xl font-extrabold tracking-tight text-foreground">
                Discovery without the blueprint
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/70">
                {[
                  "Title, sector, and broad region only",
                  "A 2–3 sentence elevator pitch",
                  "CAPEX band, target IRR, and funding stage",
                  "1–2 concept images",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-1.5 size-5 shrink-0 text-brand-sky" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-xl border border-brand-sky/30 bg-brand-sky-muted p-4 sm:p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand-sky">
                <Lock className="size-4" aria-hidden />
                Handled by advisors
              </div>
              <h2 className="mt-2 font-display text-xl font-extrabold tracking-tight text-foreground">
                Request, vet, then NDA
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/70">
                {[
                  "Request the dossier and confirm your work email with a magic link",
                  "SARA Advisors vet the inquiry at the deal desk",
                  "They arrange the NDA, then share the Vault offline",
                  "Exact location, founder details, and files never go public",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <Lock className="mt-1.5 size-5 shrink-0 text-brand-sky" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <ProjectBankAudience />

          <FaqList items={FAQ} />

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <SmoothButton asChild size="lg" variant="candy">
              <Link href="/project-bank/discover">
                Browse projects
                <ArrowRight className="size-4" />
              </Link>
            </SmoothButton>
            <SmoothButton asChild size="lg" variant="outline">
              <Link href="/project-bank/new">List your idea</Link>
            </SmoothButton>
          </div>
        </section>
      </main>
    </>
  );
}
