"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimatedGroup, AnimatedText } from "@/components/smoothui/shared";
import SmoothButton from "@/components/smoothui/smooth-button";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { siteConfig } from "@/lib/site-config";

const InteractiveHeroGrid = dynamic(
  () =>
    import("@/components/marketing/interactive-hero-grid").then((m) => m.InteractiveHeroGrid),
  { ssr: false }
);

const HERO_SUPPORT =
  "Company formation, M&A, asset revival, investment matchmaking, and carbon finance — from Kathmandu.";

export function AsarHeroGrid() {
  return (
    <section className="relative flex min-h-[calc(78svh-5rem-4.75rem)] items-center overflow-hidden px-4 pt-10 pb-6 sm:px-6 sm:pt-14 sm:pb-8 lg:min-h-[calc(82svh-5rem)] lg:pt-16 lg:pb-10">
      <InteractiveHeroGrid />
      <AnimatedGroup
        className="pointer-events-none relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-4 text-center sm:gap-5"
        preset="blur-slide"
      >
        <p className="text-xs font-semibold tracking-[0.2em] text-tz-blue-deep uppercase">{siteConfig.tagline}</p>
        <div>
          <AnimatedText
            as="h1"
            className="heading-soft mb-3 max-w-4xl text-balance font-heading text-[1.7rem] leading-[1.28] font-semibold tracking-[-0.015em] sm:mb-4 sm:text-[2rem] md:text-[2.6rem]"
          >
            A single-window gateway for corporate, investment, and strategic consulting in Nepal
          </AnimatedText>
          <AnimatedText
            as="p"
            className="heading-soft mx-auto max-w-2xl text-pretty text-[1.05rem] leading-[1.75] text-muted-foreground"
            delay={0.15}
          >
            {HERO_SUPPORT}
          </AnimatedText>
        </div>
        <AnimatedGroup className="pointer-events-auto flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center" preset="slide">
          <RainbowButton asChild size="lg" className="h-11 w-full rounded-full px-8 sm:w-auto">
            <Link href="/marketplace">
              Explore M&A Marketplace
              <ArrowRight className="size-4" />
            </Link>
          </RainbowButton>
          <SmoothButton asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link href="/project-bank/discover">Browse Project Bank</Link>
          </SmoothButton>
        </AnimatedGroup>
      </AnimatedGroup>
    </section>
  );
}
