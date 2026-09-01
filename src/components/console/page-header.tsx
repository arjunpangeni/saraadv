import { AnimatedGroup, AnimatedText } from "@/components/smoothui/shared";
import { InteractiveHeroGrid } from "@/components/marketing/interactive-hero-grid";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  withGrid = false,
  compact = false,
  narrow = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  withGrid?: boolean;
  compact?: boolean;
  narrow?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden border-b border-border-subtle", className)}>
      {withGrid ? <InteractiveHeroGrid /> : null}
      <div
        className={cn(
          "container-console relative z-10",
          compact ? (narrow ? "mx-auto max-w-3xl py-4 sm:py-5" : "mx-auto max-w-6xl py-4 sm:py-5") : "py-6 sm:py-8"
        )}
      >
        <AnimatedGroup
          className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4"
          preset="blur-slide"
        >
          <div className="min-w-0">
            {eyebrow ? (
              <p className="mb-1 text-sm font-medium tracking-tight text-brand-sky">{eyebrow}</p>
            ) : null}
            <AnimatedText
              as="h1"
              className={cn(
                "text-pretty font-display font-extrabold tracking-tight text-foreground",
                compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
              )}
            >
              {title}
            </AnimatedText>
            {description ? (
              <AnimatedText
                as="p"
                delay={0.08}
                className={cn(
                  "max-w-2xl text-pretty leading-relaxed text-foreground/70",
          compact ? "mt-2 text-sm" : "mt-2 text-base"
                )}
              >
                {description}
              </AnimatedText>
            ) : null}
          </div>
          {actions ? (
            <div className="pointer-events-auto flex flex-wrap gap-2 sm:shrink-0">{actions}</div>
          ) : null}
        </AnimatedGroup>
      </div>
    </div>
  );
}
