"use client";

import { Building2, Lightbulb } from "lucide-react";
import { ROLE_OPTIONS, type SignupRole } from "@/lib/auth-utils";
import { cn } from "@/lib/utils";

const ROLE_ICONS: Record<SignupRole, typeof Building2> = {
  SELLER: Building2,
  ENTREPRENEUR: Lightbulb,
};

export function RolePicker({
  value,
  onChange,
  compact = false,
}: {
  value: SignupRole;
  onChange: (role: SignupRole) => void;
  compact?: boolean;
}) {
  return (
    <fieldset className={compact ? "space-y-1.5" : "space-y-2"}>
      <legend className={cn("font-medium text-foreground", compact ? "text-xs" : "text-sm")}>
        {compact ? "Choose Seller or Project owner, then continue" : "I want to"}
      </legend>
      <div className={cn("grid grid-cols-2", compact ? "gap-1.5" : "gap-2")}>
        {ROLE_OPTIONS.map((option) => {
          const isSelected = option.value === value;
          const Icon = ROLE_ICONS[option.value];
          return (
            <label
              key={option.value}
              className={cn(
                "cursor-pointer border transition-colors",
                compact ? "flex items-center gap-1.5 rounded-lg px-2 py-2" : "rounded-xl p-3",
                isSelected
                  ? "border-brand-sky bg-brand-sky/10 ring-1 ring-brand-sky"
                  : "border-border bg-background hover:border-brand-sky/40"
              )}
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {compact ? (
                <>
                  <Icon className="size-3.5 shrink-0 text-brand-sky" aria-hidden />
                  <span className="text-xs font-semibold leading-none text-foreground">{option.shortLabel}</span>
                </>
              ) : (
                <>
                  <span className="block text-sm font-semibold text-foreground">{option.label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{option.hint}</span>
                </>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
