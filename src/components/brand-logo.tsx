import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  href?: string | null;
  className?: string;
  markClassName?: string;
  priority?: boolean;
  linked?: boolean;
  invertOnDarkPanel?: boolean;
  showTagline?: boolean;
  /** Compact lockup for sticky headers / sidebars */
  compact?: boolean;
}

export function BrandLogo({
  href = "/",
  className,
  markClassName,
  priority = false,
  linked = true,
  invertOnDarkPanel = false,
  showTagline = false,
  compact = false,
}: BrandLogoProps) {
  const ink = invertOnDarkPanel
    ? "text-white"
    : "text-foreground";
  const rule = invertOnDarkPanel ? "bg-white/35" : "bg-brand-sky";
  const tagline = invertOnDarkPanel
    ? "text-white/75"
    : "text-muted-foreground";

  const content = (
    <span
      className={cn(
        "inline-flex items-center shrink-0",
        compact ? "gap-2" : "gap-2.5",
        className
      )}
    >
      <span
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-[0.3rem] shrink-0",
          compact ? "h-9 w-9 sm:h-10 sm:w-10" : "h-11 w-11 sm:h-12 sm:w-12",
          markClassName
        )}
      >
        <Image
          src="/logo2.png"
          alt=""
          width={compact ? 40 : 48}
          height={compact ? 40 : 48}
          className="h-full w-full object-contain"
          priority={priority}
        />
      </span>

      <span className={cn("flex flex-col justify-center min-w-0 text-left leading-none", ink)}>
        <span
          className={cn(
            "font-display font-semibold tracking-tight",
            compact ? "text-[1.2rem] sm:text-[1.35rem]" : "text-[1.45rem] sm:text-[1.65rem]"
          )}
        >
          SARA
        </span>
        <span
          className={cn(
            "font-display font-semibold tracking-[0.18em]",
            compact
              ? "text-[0.58rem] sm:text-[0.65rem] mt-0.5"
              : "text-[0.7rem] sm:text-[0.78rem] mt-1"
          )}
        >
          ADVISORS
        </span>
        {showTagline && (
          <>
            <span className={cn("mt-1.5 block h-px w-full", rule)} aria-hidden />
            <span
              className={cn(
                "mt-1 font-sans font-bold uppercase tracking-[0.14em]",
                compact ? "text-[0.45rem]" : "text-[0.5rem] sm:text-[0.55rem]",
                tagline
              )}
            >
              Invest. Reinvest. Disinvest.
            </span>
          </>
        )}
      </span>
    </span>
  );

  if (!linked || href === null) return content;
  return (
    <Link href={href || "/"} className="shrink-0" aria-label="SARA Advisors home">
      {content}
    </Link>
  );
}
