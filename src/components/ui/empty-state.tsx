import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card text-center shadow-[var(--shadow-card)]",
        compact ? "px-4 py-5 sm:px-5" : "px-5 py-10 sm:px-8 sm:py-12",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto flex items-center justify-center rounded-2xl bg-brand-sky-muted text-brand-sky",
          compact ? "mb-3 size-10" : "mb-5 size-14"
        )}
      >
        <Icon className={compact ? "size-5" : "size-6"} aria-hidden />
      </div>
      <p
        className={cn(
          "font-display font-extrabold tracking-tight text-foreground",
          compact ? "text-base" : "text-xl"
        )}
      >
        {title}
      </p>
      {description && (
        <p
          className={cn(
            "mx-auto text-pretty leading-relaxed text-foreground/70",
            compact ? "mt-1 max-w-sm text-sm" : "mt-2 max-w-md text-base"
          )}
        >
          {description}
        </p>
      )}
      {action && <div className={compact ? "mt-4" : "mt-6"}>{action}</div>}
    </div>
  );
}
