"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimatedGroup, AnimatedText } from "@/components/smoothui/shared";
import SmoothButton from "@/components/smoothui/smooth-button";
import { InteractiveHeroGrid } from "@/components/marketing/interactive-hero-grid";
import { siteConfig } from "@/lib/site-config";

const HERO_SUPPORT =
  "Company formation, M&A, asset revival, investment matchmaking, and carbon finance — from Kathmandu.";

export function SaraHeroGrid() {
  return (
    <section className="relative flex min-h-[calc(100svh-4rem-4.75rem)] items-center overflow-hidden px-4 py-10 sm:px-6 sm:py-14 lg:min-h-[calc(100svh-4.75rem)] lg:py-16">
      <InteractiveHeroGrid />
      <AnimatedGroup
        className="pointer-events-none relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-4 text-center sm:gap-5"
        preset="blur-slide"
      >
        <p className="text-sm font-medium tracking-tight text-brand-sky">{siteConfig.tagline}</p>
        <div>
          <AnimatedText
            as="h1"
            className="mb-3 max-w-4xl text-pretty font-display text-3xl font-extrabold tracking-tight sm:mb-4 sm:text-4xl lg:text-5xl"
          >
            A single-window gateway for corporate, investment, and strategic consulting in Nepal
          </AnimatedText>
          <AnimatedText
            as="p"
            className="mx-auto max-w-2xl text-pretty text-base leading-relaxed text-foreground/70 sm:text-lg"
            delay={0.15}
          >
            {HERO_SUPPORT}
          </AnimatedText>
        </div>
        <AnimatedGroup className="pointer-events-auto flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center" preset="slide">
          <SmoothButton asChild size="lg" variant="candy" className="w-full sm:w-auto">
            <Link href="/marketplace">
              Explore M&A Marketplace
              <ArrowRight className="size-4" />
            </Link>
          </SmoothButton>
          <SmoothButton asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link href="/project-bank/discover">Browse Project Bank</Link>
          </SmoothButton>
        </AnimatedGroup>
      </AnimatedGroup>
    </section>
  );
}
