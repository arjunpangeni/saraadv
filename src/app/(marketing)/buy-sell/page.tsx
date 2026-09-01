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
    "Trusted M&A advisory and business brokerage in Nepal. Browse anonymized business opportunities, request deep scrutiny under NDA, and connect with SARA Advisors for due diligence and deal execution.",
  path: "/buy-sell",
  ogTitle: "Buy or sell a business in Nepal | SARA Advisors",
});

const INTRO =
  "SARA Advisors acts as a trusted intermediary for corporate acquisitions, mergers, and business transfers in Nepal — anonymized discovery first, then NDA-gated due diligence.";

const FAQ: FaqItem[] = [
  {
    question: "Will my company name appear on the marketplace?",
    answer:
      "No. Public cards use an anonymized reference ID (for example SARA-MA-102), sector, location, and high-level financials. Identifying data and the data room unlock only after an NDA and advisor review.",
  },
  {
    question: "What do buyers see before signing an NDA?",
    answer:
      "Licensed capacity, largest expected turnover within three years, current audited balance-sheet size, proposed sale value, transaction modality, valuation justification, and reason for exit. Line-item books stay locked.",
  },
  {
    question: "How do I unlock a full profile?",
    answer:
      "Confirm your work email with a one-time magic link — no buyer account. After SARA Advisors vet the request and arrange an NDA, the data room is shared offline.",
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
          tight
          cta={{ label: "Browse the marketplace", href: "/marketplace" }}
          secondaryCta={{
            label: "List a business",
            href: "/register?role=SELLER&callbackUrl=/sell/new",
          }}
        />

        <section className="container-page py-8 sm:py-10">
          <SectionHeading
            eyebrow="Teaser & Gate"
            title="What buyers see — and what stays locked"
            description="The public card is an anonymized teaser. Line-item books, revaluations, and attachments unlock only after a binding NDA."
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
                Discovery without the books
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/70">
                {[
                  "Anonymized reference ID — never the company name",
                  "Sector, legal structure, and province / district",
                  "Licensed capacity, largest expected turnover, audited BS size",
                  "Proposed sale value, modality, justification, and exit reason",
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
                NDA data room
              </div>
              <h2 className="mt-2 font-display text-xl font-extrabold tracking-tight text-foreground">
                Request, NDA, then unlock
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/70">
                {[
                  "Confirm your work email with a magic link — no password or buyer account",
                  "SARA Advisors vet the request and arrange an NDA",
                  "The full data room is shared offline, never published on the teaser",
                  "A priority ticket opens on the SARA deal desk",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <Lock className="mt-1.5 size-5 shrink-0 text-brand-sky" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <BuySellAudience />

          <FaqList items={FAQ} />

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <SmoothButton asChild size="lg" variant="candy">
              <Link href="/marketplace">
                Browse the marketplace
                <ArrowRight className="size-4" />
              </Link>
            </SmoothButton>
            <SmoothButton asChild size="lg" variant="outline">
              <Link href="/register?role=SELLER&callbackUrl=/sell/new">List a business</Link>
            </SmoothButton>
          </div>
        </section>
      </main>
    </>
  );
}
