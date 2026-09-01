import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { InteractiveHeroGrid } from "@/components/marketing/interactive-hero-grid";
import { AuthCard } from "@/components/auth/auth-card";
import { cn } from "@/lib/utils";

export function AuthShell({
  title,
  subtitle,
  children,
  compact = false,
  bare = false,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  compact?: boolean;
  /** Skip the default single card so the page can compose smaller cards. */
  bare?: boolean;
}) {
  return (
    <div className="grid min-h-dvh bg-background lg:h-dvh lg:overflow-hidden lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-12">
        <InteractiveHeroGrid />
        <div className="relative z-10">
          <BrandLogo showTagline priority />
        </div>
        <div className="relative z-10 max-w-md">
          <p className="mb-3 text-sm font-medium tracking-tight text-brand-sky">Advisory platform</p>
          <h1 className="text-pretty font-display text-2xl font-extrabold tracking-tight text-foreground xl:text-3xl">
            Corporate, investment & strategic consulting for Nepal
          </h1>
          <p className="mt-3 text-base leading-relaxed text-foreground/70 xl:text-lg">
            From company formation and M&A brokerage to project matchmaking and carbon finance.
          </p>
        </div>
        <p className="relative z-10 text-sm text-foreground/70">Kathmandu, Nepal</p>
      </div>

      <div className="relative flex min-h-dvh flex-col justify-center overflow-x-hidden px-6 py-10 sm:px-12 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:px-10 lg:py-6">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle className="text-foreground" />
        </div>
        <div className="mb-6 inline-flex lg:mb-0 lg:hidden">
          <BrandLogo compact />
        </div>
        <div className="mx-auto w-full min-w-0 max-w-sm">
          {bare ? (
            children
          ) : (
            <AuthCard className={compact ? "p-4" : "p-5 sm:p-6"}>
              {title ? (
                <h2
                  className={cn(
                    "font-display font-extrabold tracking-tight text-foreground",
                    compact ? "text-lg" : "text-xl sm:text-2xl"
                  )}
                >
                  {title}
                </h2>
              ) : null}
              {subtitle ? (
                <p
                  className={cn(
                    "text-foreground/70",
                    compact ? "mt-1 text-xs leading-snug" : "mt-2 text-sm leading-relaxed"
                  )}
                >
                  {subtitle}
                </p>
              ) : null}
              <div className={cn(title || subtitle ? (compact ? "mt-3.5" : "mt-5") : undefined)}>
                {children}
              </div>
            </AuthCard>
          )}
        </div>
      </div>
    </div>
  );
}
