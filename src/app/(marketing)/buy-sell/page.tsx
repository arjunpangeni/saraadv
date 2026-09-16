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
import { BuySellAudience } from "@/components/marketplace/buy-sell-audience";

export const metadata: Metadata = pageMetadata({
  title: "Buy / Sell a Business in Nepal - M&A Advisory & Brokerage",
  description:
    "Trusted M&A advisory and business brokerage in Nepal. Browse anonymized business opportunities, request deep scrutiny under NDA, and connect with ASAR Partners for due diligence and deal execution.",
  path: "/buy-sell",
  ogTitle: "Buy or sell a business in Nepal | ASAR Partners",
});

const INTRO =
  "ASAR Partners acts as a trusted intermediary for corporate acquisitions, mergers, and business transfers in Nepal — anonymized discovery first, then NDA-gated due diligence.";

const FAQ: FaqItem[] = [
  {
    question: "Will my company name appear on the marketplace?",
    answer:
      "No. Public cards use an anonymized reference ID (for example ASAR-MA-102), sector, location, and high-level financials. Identifying data and the data room unlock only after an NDA and advisor review.",
  },
  {
    question: "What do buyers see before signing an NDA?",
    answer:
      "Licensed capacity, largest expected turnover within three years, current audited balance-sheet size, proposed sale value, transaction modality, valuation justification, and reason for exit. Line-item books stay locked.",
  },
  {
    question: "How do I unlock a full profile?",
    answer:
      "Confirm your work email with a one-time magic link — no buyer account. After ASAR Partners vet the request and arrange an NDA, the data room is shared offline.",
  },
];

export default function BuySellPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "M&A Advisory & Business Brokerage",
          name: `Buy or sell a business in Nepal - ${siteConfig.name}`,
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
          eyebrow="M&A Advisory and Business Brokerage"
          title="Buy or sell a business in Nepal"
          description={INTRO}
          cta={{ label: "Browse the marketplace", href: "/marketplace" }}
          secondaryCta={{
            label: "List a business",
            href: "/register?role=SELLER&callbackUrl=/sell/new",
          }}
          compact
        />

        <section className="container-page py-14 sm:py-20 lg:py-28">
          <SectionHeading
            eyebrow="Teaser & Gate"
            title="What buyers see — and what stays locked"
            description="The public card is an anonymized teaser. Line-item books, revaluations, and attachments unlock only after a binding NDA."
            align="center"
            className="mb-10 sm:mb-12 lg:mb-14"
          />

          <div className="mb-10 grid gap-12 sm:mb-12 sm:grid-cols-2 sm:gap-5">
            <article className="group rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 sm:p-6">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-tz-blue-deep uppercase">
                <Eye className="size-4" aria-hidden />
                Public teaser
              </div>
              <h2 className="heading-soft mt-3 text-pretty font-heading text-xl font-semibold tracking-[-0.015em] text-foreground lg:text-[1.45rem]">
                Discovery without the books
              </h2>
              <ul className="mt-3 space-y-2.5 text-[1.05rem] leading-[1.75] text-muted-foreground">
                {[
                  "Anonymized reference ID — never the company name",
                  "Sector, legal structure, and province / district",
                  "Licensed capacity, largest expected turnover, audited BS size",
                  "Proposed sale value, modality, justification, and exit reason",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-1.5 size-5 shrink-0 text-primary" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="group rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 sm:p-6">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-tz-blue-deep uppercase">
                <Lock className="size-4" aria-hidden />
                NDA data room
              </div>
              <h2 className="heading-soft mt-3 text-pretty font-heading text-xl font-semibold tracking-[-0.015em] text-foreground lg:text-[1.45rem]">
                Request, NDA, then unlock
              </h2>
              <ul className="mt-3 space-y-2.5 text-[1.05rem] leading-[1.75] text-muted-foreground">
                {[
                  "Confirm your work email with a magic link — no password or buyer account",
                  "ASAR Partners vet the request and arrange an NDA",
                  "The full data room is shared offline, never published on the teaser",
                  "A priority ticket opens on the ASAR deal desk",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <Lock className="mt-1.5 size-5 shrink-0 text-primary" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <BuySellAudience />

          <FaqList items={FAQ} />

          <div className="mt-12 flex flex-col items-stretch justify-center gap-3 sm:mt-14 sm:flex-row sm:flex-wrap sm:items-center">
            <SmoothButton asChild size="lg" variant="candy" className="w-full sm:w-auto">
              <Link href="/marketplace">
                Browse the marketplace
                <ArrowRight className="size-4" />
              </Link>
            </SmoothButton>
            <SmoothButton asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/register?role=SELLER&callbackUrl=/sell/new">List a business</Link>
            </SmoothButton>
          </div>
        </section>
      </main>
    </>
  );
}
