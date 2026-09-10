"use client";

import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRight,
  Building2,
  Landmark,
  Leaf,
  TrendingUp,
} from "lucide-react";
import GlowHover, { type GlowHoverTheme } from "@/components/smoothui/glow-hover-card";
import SmoothButton from "@/components/smoothui/smooth-button";
import { cn } from "@/lib/utils";

const SERVICES = [
  {
    title: "Start a Business",
    href: "/start-a-business",
    focus: "Turnkey Corporate Setup",
    description:
      "End-to-end incubation for domestic enterprises and FDI ventures — from regulatory approval to daily operations.",
    icon: Building2,
    iconWrap: "bg-tz-green text-tz-green-deep",
    accent: "text-tz-green-deep",
    theme: { hue: 152, saturation: 55, lightness: 42 } satisfies GlowHoverTheme,
  },
  {
    title: "Buy / Sell",
    href: "/buy-sell",
    focus: "M&A & Business Brokerage",
    description:
      "Trusted advisory for corporate acquisitions, mergers, and business transfers with absolute confidentiality.",
    icon: ArrowLeftRight,
    iconWrap: "bg-tz-blue text-tz-blue-deep",
    accent: "text-tz-blue-deep",
    theme: { hue: 205, saturation: 70, lightness: 42 } satisfies GlowHoverTheme,
  },
  {
    title: "Asset Management",
    href: "/asset-management",
    focus: "Corporate Revival",
    description:
      "Targeted intervention strategies to restructure, revive, and optimize distressed or underperforming assets.",
    icon: TrendingUp,
    iconWrap: "bg-[#ffe7c4] text-tz-gold dark:bg-[rgba(232,195,106,0.18)]",
    accent: "text-tz-gold",
    theme: { hue: 42, saturation: 70, lightness: 45 } satisfies GlowHoverTheme,
  },
  {
    title: "Project Bank",
    href: "/project-bank",
    focus: "Investment Deal Flow",
    description:
      "A proprietary pipeline bridging entrepreneurs with investors seeking high-yield opportunities across Nepal.",
    icon: Landmark,
    iconWrap: "bg-tz-pink text-tz-pink-deep",
    accent: "text-tz-pink-deep",
    theme: { hue: 340, saturation: 55, lightness: 55 } satisfies GlowHoverTheme,
  },
  {
    title: "Carbon Finance",
    href: "/carbon-finance",
    focus: "Credits & climate investment",
    description:
      "High-integrity Nepal carbon projects — hydropower, forestry, household energy — matched with buyers, funds, and investors.",
    icon: Leaf,
    iconWrap: "bg-tz-green text-tz-green-deep",
    accent: "text-tz-green-deep",
    theme: { hue: 152, saturation: 55, lightness: 40 } satisfies GlowHoverTheme,
    span: "sm:col-span-2 lg:col-span-1 lg:col-start-2",
  },
] as const;

export function HomeServiceCards() {
  return (
    <GlowHover
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5"
      glowIntensity={0.22}
      maskSize={320}
      items={SERVICES.map((s) => ({
        id: s.href,
        theme: s.theme,
        element: (
          <article
            className={cn(
              "group flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5",
              "span" in s ? s.span : undefined
            )}
          >
            <div
              className={cn(
                "mb-5 flex size-12 items-center justify-center rounded-xl",
                s.iconWrap
              )}
            >
              <s.icon className="size-6" aria-hidden />
            </div>
            <p className={cn("text-sm font-medium tracking-tight", s.accent)}>
              {s.focus}
            </p>
            <h3 className="heading-soft mt-1.5 text-pretty font-heading text-xl font-semibold tracking-[-0.015em] text-foreground lg:text-[1.45rem]">
              {s.title}
            </h3>
            <p className="mt-3 flex-1 text-pretty text-[1.05rem] leading-[1.75] text-muted-foreground">
              {s.description}
            </p>
            <SmoothButton asChild variant="candy" size="sm" className="mt-5 w-fit">
              <Link href={s.href}>
                Learn more
                <ArrowRight className="size-4" />
              </Link>
            </SmoothButton>
          </article>
        ),
      }))}
    />
  );
}
