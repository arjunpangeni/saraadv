"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WizardStepFill } from "@/components/console/wizard-steps";

type StepItem = { label: string; short: string; optional?: boolean };

export function ListingWizardNav({
  steps,
  current,
  statuses,
  canOpen,
  onSelect,
}: {
  steps: readonly StepItem[];
  current: number;
  statuses: readonly WizardStepFill[];
  canOpen: (index: number) => boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <>
      <div className="mb-6 border-b border-border pb-3 lg:hidden">
        <ol className="flex items-center justify-between gap-1" aria-label="Listing progress">
          {steps.map((step, i) => (
            <li key={step.label} className="flex-1">
              <MobileDot
                index={i}
                label={step.label}
                optional={step.optional}
                current={current}
                fill={statuses[i]}
                locked={!canOpen(i)}
                onSelect={onSelect}
              />
            </li>
          ))}
        </ol>
        <p className="mt-2.5 text-sm font-semibold text-foreground">
          {steps[current]?.label}
          {steps[current]?.optional ? (
            <span className="ml-1.5 font-normal text-foreground/50">Optional</span>
          ) : null}
          <span className="ml-2 font-normal text-muted-foreground">
            {current + 1} of {steps.length}
          </span>
        </p>
      </div>

      <div className="mb-8 hidden rounded-2xl border border-border bg-background px-3 py-4 lg:block">
        <ol className="grid grid-cols-8" aria-label="Listing progress">
          {steps.map((step, i) => {
            const complete = statuses[i] === "complete";
            const isCurrent = i === current;
            const locked = !canOpen(i);
            const lineDone = complete;

            return (
              <li key={step.label} className="relative flex flex-col items-center px-1">
                {i < steps.length - 1 ? (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-[15px] left-[calc(50%+14px)] right-[calc(-50%+14px)] h-0.5",
                      lineDone ? "bg-green" : "bg-border"
                    )}
                  />
                ) : null}
                <button
                  type="button"
                  title={step.optional ? `${step.label} (optional)` : step.label}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`${step.label}${step.optional ? ", optional" : ""}${complete ? ", complete" : ", not started"}${locked ? ", locked" : ""}`}
                  disabled={locked}
                  onClick={() => onSelect(i)}
                  className={cn(
                    "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                    locked && "cursor-not-allowed opacity-50",
                    complete && !isCurrent && "border-success-fg/40 bg-success-bg text-success-fg",
                    complete && isCurrent && "border-brand-sky bg-brand-sky text-white ring-2 ring-brand-sky/25",
                    !complete && !isCurrent && "border-border bg-card text-foreground/55",
                    !complete && isCurrent && "border-brand-sky bg-brand-sky text-white ring-2 ring-brand-sky/25"
                  )}
                >
                  {complete && !isCurrent ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
                </button>
                <span
                  className={cn(
                    "mt-2 max-w-full truncate text-center text-[11px] leading-tight",
                    isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.short}
                  {step.optional ? <span className="block font-normal opacity-70">Optional</span> : null}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}

function MobileDot({
  index,
  label,
  optional,
  current,
  fill,
  locked,
  onSelect,
}: {
  index: number;
  label: string;
  optional?: boolean;
  current: number;
  fill: WizardStepFill | undefined;
  locked: boolean;
  onSelect: (index: number) => void;
}) {
  const isCurrent = index === current;
  const complete = fill === "complete";

  return (
    <button
      type="button"
      title={optional ? `${label} (optional)` : label}
      aria-label={`${label}${optional ? ", optional" : ""}${complete ? ", complete" : ", not started"}`}
      aria-current={isCurrent ? "step" : undefined}
      disabled={locked}
      onClick={() => onSelect(index)}
      className={cn(
        "mx-auto flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring",
        locked && "cursor-not-allowed opacity-50",
        complete && !isCurrent && "border-success-fg/30 bg-success-bg text-success-fg",
        complete && isCurrent && "border-brand-sky bg-brand-sky text-white ring-2 ring-brand-sky/30",
        !complete && !isCurrent && "border-border bg-card text-foreground/55",
        !complete && isCurrent && "border-brand-sky bg-brand-sky text-white ring-2 ring-brand-sky/30"
      )}
    >
      {complete && !isCurrent ? <Check className="h-3.5 w-3.5" aria-hidden /> : index + 1}
    </button>
  );
}
