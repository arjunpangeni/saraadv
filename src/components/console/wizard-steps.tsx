import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type WizardStepFill = "complete" | "incomplete";

export function WizardSteps({
  steps,
  current,
  onSelect,
  statuses,
  sticky,
}: {
  steps: readonly string[];
  current: number;
  onSelect?: (index: number) => void;
  statuses?: readonly WizardStepFill[];
  sticky?: boolean;
}) {
  const label = steps[current] ?? "";
  const progress = ((current + 1) / steps.length) * 100;
  const clickable = typeof onSelect === "function";

  return (
    <div
      className={cn(
        "mb-6",
        sticky &&
          "sticky top-16 z-20 -mx-4 mb-6 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-md sm:top-[4.25rem] sm:-mx-0 sm:rounded-xl sm:border sm:px-3"
      )}
    >
      {!statuses && (
        <>
          <p className="heading-soft font-heading text-sm font-semibold tracking-[-0.015em] text-foreground sm:hidden">
            Step {current + 1} of {steps.length}
            {label ? `: ${label}` : ""}
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted sm:hidden" aria-hidden>
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
          statuses
            ? "flex overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : "hidden flex-wrap sm:flex"
        )}
      >
        {steps.map((stepLabel, i) => {
          const fill = statuses?.[i];
          const isCurrent = i === current;
          const className = cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-left font-medium transition-colors",
            clickable && "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
            clickable && !isCurrent && fill === "complete" && "hover:bg-success-bg",
            clickable && !isCurrent && fill === "incomplete" && "hover:bg-destructive/15"
          );

          return (
            <li key={stepLabel}>
              {clickable ? (
                <button type="button" className={className} onClick={() => onSelect(i)} aria-current={isCurrent ? "step" : undefined}>
                  {fill === "complete" ? <Check className="h-3.5 w-3.5 shrink-0" aria-hidden /> : (
                    <span className="tabular-nums opacity-80">{i + 1}</span>
                  )}
                  {stepLabel}
                </button>
              ) : (
                <span className={className}>
                  {i + 1}. {stepLabel}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
