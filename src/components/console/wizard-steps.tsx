import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type WizardStepFill = "complete" | "incomplete";

export function WizardSteps({
  steps,
  current,
  onSelect,
  canSelect,
  statuses,
  sticky,
  className,
  layout = "pills",
}: {
  steps: readonly string[];
  current: number;
  onSelect?: (index: number) => void;
  /** When set, only indexes that return true are clickable. Defaults to all when onSelect is provided. */
  canSelect?: (index: number) => boolean;
  statuses?: readonly WizardStepFill[];
  sticky?: boolean;
  className?: string;
  /** `sidebar` = vertical steps on lg+ (sticky), compact progress on small screens */
  layout?: "pills" | "sidebar";
}) {
  const label = steps[current] ?? "";
  const progress = ((current + 1) / steps.length) * 100;
  const clickable = typeof onSelect === "function";
  const sidebar = layout === "sidebar";

  function selectable(i: number) {
    if (!clickable) return false;
    if (canSelect) return canSelect(i);
    return true;
  }

  return (
    <div
      className={cn(
        !sidebar && "mb-5 lg:mb-4",
        // Pills sticky only when explicitly requested (not used for sidebar)
        sticky &&
          !sidebar &&
          "sticky top-16 z-40 -mx-4 mb-6 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-md sm:top-[4.25rem] sm:-mx-0 sm:rounded-xl sm:border sm:px-3",
        // Sidebar: sticky on large screens only
        sidebar &&
          "mb-5 lg:mb-0 lg:sticky lg:top-28 lg:z-30 lg:self-start lg:rounded-2xl lg:border lg:border-border lg:bg-card lg:p-3 lg:shadow-[var(--shadow-card)]",
        className
      )}
    >
      {!statuses && (
        <>
          <p
            className={cn(
              "heading-soft font-heading text-sm font-semibold tracking-[-0.015em] text-foreground",
              sidebar
                ? "lg:mb-3 lg:text-xs lg:font-semibold lg:tracking-[0.14em] lg:text-muted-foreground lg:uppercase"
                : "sm:hidden"
            )}
          >
            <span className={cn(sidebar && "lg:hidden")}>
              Step {current + 1} of {steps.length}
              {label ? `: ${label}` : ""}
            </span>
            <span className={cn("hidden", sidebar && "lg:inline")}>Steps</span>
          </p>
          <div
            className={cn(
              "mt-2 h-1 overflow-hidden rounded-full bg-muted",
              sidebar ? "lg:hidden" : "sm:hidden"
            )}
            aria-hidden
          >
            <div
              className="h-full rounded-full bg-brand-sky transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}
      <ol
        className={cn(
          "gap-2 text-xs",
          sidebar
            ? "mt-3 hidden flex-col gap-1 lg:mt-0 lg:flex"
            : statuses
              ? "flex overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              : "hidden flex-wrap sm:flex"
        )}
      >
        {steps.map((stepLabel, i) => {
          const fill = statuses?.[i];
          const isCurrent = i === current;
          const done = !fill && i < current;
          const unlocked = selectable(i);
          const locked = clickable && !unlocked;

          const className = cn(
            sidebar
              ? cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[0.8125rem] font-medium transition-colors",
                  unlocked && "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  locked && "cursor-not-allowed opacity-45",
                  isCurrent
                    ? "bg-brand-sky text-white shadow-sm"
                    : done || unlocked
                      ? "text-brand-sky hover:bg-brand-sky-muted/70"
                      : "text-muted-foreground"
                )
              : cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-left font-medium transition-colors",
                  unlocked && "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  locked && "cursor-not-allowed opacity-45",
                  fill === "complete" &&
                    (isCurrent
                      ? "border-green bg-green text-green-fg shadow-sm"
                      : "border-success-fg/25 bg-success-bg text-success-fg"),
                  fill === "incomplete" &&
                    (isCurrent
                      ? "border-destructive bg-destructive text-white shadow-sm"
                      : "border-destructive/40 bg-destructive/10 text-destructive"),
                  !fill &&
                    (isCurrent
                      ? "border-brand-sky bg-brand-sky text-white"
                      : i < current
                        ? "border-brand-sky/30 bg-brand-sky-muted text-brand-sky"
                        : "border-border-subtle text-muted-foreground"),
                  unlocked && !isCurrent && fill === "complete" && "hover:bg-success-bg",
                  unlocked && !isCurrent && fill === "incomplete" && "hover:bg-destructive/15"
                )
          );

          const marker = sidebar ? (
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                isCurrent
                  ? "bg-white/20 text-white"
                  : done || unlocked
                    ? "bg-brand-sky-muted text-brand-sky"
                    : "bg-muted text-muted-foreground"
              )}
              aria-hidden
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
          ) : fill === "complete" ? (
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <span className="tabular-nums opacity-80">{i + 1}</span>
          );

          return (
            <li key={stepLabel}>
              {clickable ? (
                <button
                  type="button"
                  className={className}
                  onClick={() => {
                    if (!unlocked) return;
                    onSelect(i);
                  }}
                  disabled={locked}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-disabled={locked || undefined}
                >
                  {marker}
                  <span className="min-w-0 leading-snug">{stepLabel}</span>
                </button>
              ) : (
                <span className={className} aria-current={isCurrent ? "step" : undefined}>
                  {sidebar ? (
                    <>
                      {marker}
                      <span className="min-w-0 leading-snug">{stepLabel}</span>
                    </>
                  ) : (
                    <>
                      {i + 1}. {stepLabel}
                    </>
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
