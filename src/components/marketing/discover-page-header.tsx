import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SmoothButton from "@/components/smoothui/smooth-button";
import { cn } from "@/lib/utils";

/** Compact header for listing browse pages — keeps cards in the first viewport. */
export function DiscoverPageHeader({
  eyebrow,
  title,
  description,
  cta,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  cta?: { label: string; href: string };
  className?: string;
}) {
  return (
    <header className={cn("border-b border-border/60 bg-background", className)}>
      <div className="container-page flex items-end justify-between gap-3 py-4 sm:gap-6 sm:py-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.2em] text-tz-blue-deep uppercase">{eyebrow}</p>
          <h1 className="heading-soft mt-1 text-balance font-heading text-[1.35rem] font-semibold tracking-[-0.015em] text-foreground sm:text-[1.65rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 hidden max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:block">
              {description}
            </p>
          ) : null}
        </div>
        {cta ? (
          <SmoothButton asChild size="sm" variant="candy" className="shrink-0">
            <Link href={cta.href} prefetch={false}>
              <span className="sm:hidden">List idea</span>
              <span className="hidden sm:inline">{cta.label}</span>
              <ArrowRight className="size-4" />
            </Link>
          </SmoothButton>
        ) : null}
      </div>
    </header>
  );
}
