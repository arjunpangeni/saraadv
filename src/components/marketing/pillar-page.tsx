"use client";

import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PageHero } from "@/components/marketing/page-hero";
import { SectionHeading } from "@/components/marketing/section-heading";
import { JsonLd } from "@/components/json-ld";
import { FaqList, type FaqItem } from "@/components/marketing/faq-list";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import SmoothButton from "@/components/smoothui/smooth-button";
import GlowHover from "@/components/smoothui/glow-hover-card";

export interface PillarSection {
  heading: string;
  items: string[];
}

export interface PillarPageProps {
  title: string;
  focus: string;
  intro: string;
  sections: PillarSection[];
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  showFooterCta?: boolean;
  serviceType: string;
  faq?: FaqItem[];
}

const SPRING = { bounce: 0.1, duration: 0.25, type: "spring" as const };

export function PillarPage({
  title,
  focus,
  intro,
  sections,
  cta,
  secondaryCta,
  showFooterCta = true,
  serviceType,
  faq,
}: PillarPageProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType,
          name: `${title} - ${siteConfig.name}`,
          description: intro,
          provider: {
            "@type": "Organization",
            name: siteConfig.name,
            url: siteConfig.url,
            logo: `${siteConfig.url}/logo2.png`,
          },
          areaServed: "NP",
        }}
      />
      {faq && faq.length > 0 ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }}
        />
      ) : null}
      <main className="flex-1">
        <PageHero
          eyebrow={focus}
          title={title}
          description={intro}
          cta={cta}
          secondaryCta={secondaryCta}
          compact
        />

        <section className="container-page py-20 sm:py-28">
          <SectionHeading
            eyebrow="What's included"
            title="How this engagement works"
            description="The same advisory process we use on live Nepal mandates — scoped, documented, and confidential."
            align="center"
            className="mb-12 sm:mb-14"
          />
          <GlowHover
            className="grid gap-4 sm:grid-cols-2 sm:gap-5"
            glowIntensity={0.18}
            maskSize={280}
            items={sections.map((s, i) => ({
              id: s.heading,
              theme: { hue: 210, saturation: 78, lightness: 42 },
              element: (
                <motion.article
                  className={cn(
                    "flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]",
                    sections.length % 2 === 1 &&
                      i === sections.length - 1 &&
                      "sm:col-span-2 sm:mx-auto sm:w-full sm:max-w-xl"
                  )}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { ...SPRING, delay: i * 0.05 }}
                  viewport={{ margin: "-80px", once: true }}
                  whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                >
                  <p className="text-sm font-medium tracking-tight text-brand-sky">Advisory</p>
                  <h3 className="mt-1.5 text-pretty font-display text-2xl font-extrabold tracking-tight text-foreground">
                    {s.heading}
                  </h3>
                  <ul className="mt-4 flex-1 space-y-3">
                    {s.items.map((item) => (
                      <li key={item} className="flex gap-3 text-lg leading-relaxed text-foreground/70">
                        <CheckCircle2 className="mt-1.5 size-5 shrink-0 text-brand-sky" aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.article>
              ),
            }))}
          />

          {faq && faq.length > 0 ? <FaqList items={faq} /> : null}

          {cta && showFooterCta && (
            <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
              <SmoothButton asChild size="lg" variant="candy">
                <Link href={cta.href}>
                  {cta.label}
                  <ArrowRight className="size-4" />
                </Link>
              </SmoothButton>
              {secondaryCta && (
                <SmoothButton asChild size="lg" variant="outline">
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </SmoothButton>
              )}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
