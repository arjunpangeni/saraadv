import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import SmoothButton from "@/components/smoothui/smooth-button";
import { InteractiveHeroGrid } from "@/components/marketing/interactive-hero-grid";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  description?: string;
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  compact?: boolean;
  tight?: boolean;
  className?: string;
  brandSlot?: React.ReactNode;
  children?: React.ReactNode;
  align?: "center" | "left";
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
  description,
  cta,
  secondaryCta,
  compact,
  tight,
  className,
  brandSlot,
  children,
  align = "center",
}: PageHeroProps) {
  const centered = align === "center";

  return (
    <section className={cn("relative overflow-hidden", className)}>
      <InteractiveHeroGrid />
      <div
        className={cn(
          "container-page relative z-10",
          compact ? "py-10 sm:py-16" : "py-16 sm:py-24 lg:py-28",
          tight && "py-8 sm:py-10"
        )}
      >
        <div
          className={cn(
            "flex flex-col gap-6",
            compact && "gap-4",
            tight && "gap-4",
            centered ? "mx-auto max-w-4xl items-center text-center" : "max-w-3xl"
          )}
        >
          {brandSlot && (
            <BlurFade offset={8} className="w-full">
              {brandSlot}
            </BlurFade>
          )}

          {eyebrow && (
            <BlurFade offset={8}>
              <p className="text-sm font-medium tracking-tight text-brand-sky">{eyebrow}</p>
            </BlurFade>
          )}

          <BlurFade delay={0.08} offset={6} initial="visible">
            <h1
              className={cn(
                "text-pretty font-display font-extrabold tracking-tight text-foreground",
                compact || tight
                  ? "text-2xl sm:text-4xl lg:text-[2.75rem]"
                  : "text-3xl sm:text-4xl lg:text-5xl"
              )}
            >
              {title}
            </h1>
          </BlurFade>

          {subtitle && (
            <BlurFade delay={0.12} offset={10}>
              <p
                className={cn(
                  "max-w-3xl text-pretty text-lg font-medium leading-relaxed text-foreground lg:text-xl",
                  centered && "mx-auto"
                )}
              >
                {subtitle}
              </p>
            </BlurFade>
          )}

          {description && (
            <BlurFade delay={0.16} offset={10}>
              <p
                className={cn(
                  "max-w-3xl text-pretty leading-relaxed text-foreground/70",
                  compact || tight ? "text-lg" : "text-lg lg:text-xl",
                  centered && "mx-auto"
                )}
              >
                {description}
              </p>
            </BlurFade>
          )}

          {children && (
            <BlurFade delay={0.18} offset={8} className="flex w-full flex-col items-stretch gap-5">
              {children}
            </BlurFade>
          )}

          {(cta || secondaryCta) && (
            <BlurFade
              delay={0.2}
              offset={8}
              className={cn("flex flex-wrap items-center gap-3", centered && "justify-center")}
            >
              {cta && (
                <SmoothButton asChild size="lg" variant="candy">
                  <Link href={cta.href}>
                    {cta.label}
                    <ArrowRight className="size-4" />
                  </Link>
                </SmoothButton>
              )}
              {secondaryCta && (
                <SmoothButton asChild size="lg" variant="outline">
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </SmoothButton>
              )}
            </BlurFade>
          )}
        </div>
      </div>
    </section>
  );
}
