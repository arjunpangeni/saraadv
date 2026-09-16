"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown, ListFilter, Search, X } from "lucide-react";
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

/**
 * Compact discover chrome: optional always-visible search + Filters toggle.
 * Filter panel expands in document flow and pushes the listing grid down.
 */
export function CollapsibleDiscoverFilters({
  pending,
  resultCount,
  resultNoun,
  activeFilterCount = 0,
  search,
  chips,
  children,
  defaultOpen = false,
}: {
  pending?: boolean;
  resultCount?: number;
  resultNoun: { one: string; many: string };
  activeFilterCount?: number;
  /** Always-visible search control (marketplace). When set, sits beside Filters. */
  search?: React.ReactNode;
  chips?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const filtersButton = (
    <SmoothButton
      type="button"
      size="sm"
      variant="outline"
      aria-expanded={open}
      aria-controls={panelId}
      onClick={() => setOpen((value) => !value)}
      className="h-9 w-[6.75rem] shrink-0 gap-1.5 sm:w-[7.5rem]"
    >
      <ListFilter className="size-4" aria-hidden />
      <span className="truncate">Filters</span>
      {activeFilterCount > 0 ? (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
          {activeFilterCount}
        </span>
      ) : (
        <ChevronDown
          className={cn("size-4 opacity-70 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      )}
    </SmoothButton>
  );

  return (
    <div className={cn("mb-5", pending && "opacity-80")}>
      {search ? (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">{search}</div>
          {filtersButton}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {typeof resultCount === "number" ? (
            <p className="text-sm text-foreground/60">
              <span className="font-semibold text-foreground">{resultCount}</span>{" "}
              {resultCount === 1 ? resultNoun.one : resultNoun.many}
              {pending ? " · updating…" : ""}
            </p>
          ) : (
            <span />
          )}
          {filtersButton}
        </div>
      )}

      {typeof resultCount === "number" && search ? (
        <p className="mt-3 text-sm text-foreground/60">
          <span className="font-semibold text-foreground">{resultCount}</span>{" "}
          {resultCount === 1 ? resultNoun.one : resultNoun.many}
          {pending ? " · updating…" : ""}
        </p>
      ) : null}

      {chips ? <div className="mt-3">{chips}</div> : null}

      {open ? (
        <div
          id={panelId}
          role="region"
          aria-label="Filter options"
          className="mt-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)] sm:p-4"
        >
          {children}
        </div>
      ) : null}
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
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          enterKeyHint="search"
          className="h-9 w-full rounded-full border border-border bg-background py-1.5 pr-16 pl-3.5 text-sm text-foreground placeholder:text-foreground/50 outline-none transition focus:border-brand-sky/50 focus:ring-2 focus:ring-brand-sky/20"
        />
        {value ? (
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1/2 right-9 -translate-y-1/2 rounded-full p-1 text-foreground/50 hover:bg-surface-muted hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
        <button
          type="submit"
          aria-label="Search"
          className="absolute top-1/2 right-1 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90"
        >
          <Search className="size-3.5" aria-hidden />
        </button>
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
