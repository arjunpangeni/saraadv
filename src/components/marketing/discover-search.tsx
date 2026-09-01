"use client";

import { Search, X } from "lucide-react";
import SmoothButton from "@/components/smoothui/smooth-button";
import { cn } from "@/lib/utils";

export function DiscoverSearchShell({
  pending,
  children,
}: {
  pending?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mb-6", pending && "opacity-80")}>
      <div className="rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)] sm:p-4">
        {children}
      </div>
    </div>
  );
}

export function SearchField({
  id,
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  placeholder: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="relative"
    >
      <label htmlFor={id} className="sr-only">
        Search
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-brand-sky"
          aria-hidden
        />
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          enterKeyHint="search"
          className="h-10 w-full rounded-lg border border-border bg-background py-2 pr-[6.25rem] pl-9 text-sm text-foreground placeholder:text-foreground/50 outline-none transition focus:border-brand-sky/50 focus:ring-2 focus:ring-brand-sky/20"
        />
        {value ? (
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1/2 right-[4.5rem] -translate-y-1/2 rounded-md p-1.5 text-foreground/50 hover:bg-surface-muted hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
        <div className="absolute top-1/2 right-1.5 -translate-y-1/2">
          <SmoothButton type="submit" size="sm" variant="candy" className="h-7 px-2.5 text-xs">
            Search
          </SmoothButton>
        </div>
      </div>
    </form>
  );
}

export function FilterField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-1.5 text-sm font-medium tracking-tight text-foreground">{label}</p>
      {children}
    </div>
  );
}

export function FilterChips({
  chips,
  onRemove,
  onClear,
}: {
  chips: { key: string; label: string }[];
  onRemove: (key: string) => void;
  onClear: () => void;
}) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onRemove(chip.key)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-brand-sky/20 bg-brand-sky-muted py-1 pr-2 pl-3 text-sm font-medium text-brand-sky transition-colors hover:bg-brand-sky-muted/80"
        >
          {chip.label}
          <X className="size-3.5 opacity-70" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="text-sm font-semibold text-foreground/70 hover:text-brand-sky"
      >
        Clear all
      </button>
    </div>
  );
}

export function SuggestionPills({
  items,
  onPick,
}: {
  items: string[];
  onPick: (value: string) => void;
}) {
  return (
    <div className="mt-3 hidden flex-wrap items-center gap-2 sm:flex">
      <span className="text-sm font-medium tracking-tight text-foreground/70">Try</span>
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPick(item)}
          className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:border-brand-sky/40 hover:text-brand-sky"
        >
          {item}
        </button>
      ))}
    </div>
  );
}
