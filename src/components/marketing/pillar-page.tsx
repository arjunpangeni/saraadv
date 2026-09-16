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

        <section className="container-page py-14 sm:py-20 lg:py-28">
          <SectionHeading
            eyebrow="What's included"
            title="How this engagement works"
            description="The same advisory process we use on live Nepal mandates — scoped, documented, and confidential."
            align="center"
            className="mb-10 sm:mb-12 lg:mb-14"
          />
          <GlowHover
            className="grid gap-12 sm:grid-cols-2 sm:gap-5"
            glowIntensity={0.22}
            maskSize={320}
            items={sections.map((s, i) => ({
              id: s.heading,
              theme: { hue: 152, saturation: 55, lightness: 42 },
              element: (
                <motion.article
                  className={cn(
                    "group flex h-full flex-col rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 sm:p-6",
                    sections.length % 2 === 1 &&
                      i === sections.length - 1 &&
                      "sm:col-span-2 sm:mx-auto sm:w-full sm:max-w-xl"
                  )}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { ...SPRING, delay: i * 0.05 }}
                  viewport={{ margin: "-80px", once: true }}
                  whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                >
                  <h3 className="heading-soft text-pretty font-heading text-xl font-semibold tracking-[-0.015em] text-foreground lg:text-[1.45rem]">
                    {s.heading}
                  </h3>
                  <ul className="mt-3 flex-1 space-y-2.5">
                    {s.items.map((item) => (
                      <li
                        key={item}
                        className="flex gap-3 text-pretty text-[1.05rem] leading-[1.75] text-muted-foreground"
                      >
                        <CheckCircle2 className="mt-1.5 size-5 shrink-0 text-primary" aria-hidden />
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
            <div className="mt-12 flex flex-col items-stretch justify-center gap-3 sm:mt-14 sm:flex-row sm:flex-wrap sm:items-center">
              <SmoothButton asChild size="lg" variant="candy" className="w-full sm:w-auto">
                <Link href={cta.href}>
                  {cta.label}
                  <ArrowRight className="size-4" />
                </Link>
              </SmoothButton>
              {secondaryCta && (
                <SmoothButton asChild size="lg" variant="outline" className="w-full sm:w-auto">
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
