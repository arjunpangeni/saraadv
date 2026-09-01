import Link from "next/link";
import { cn } from "@/lib/utils";

export function FilterTabs({
  items,
  className,
  wrap = false,
}: {
  items: { href: string; label: string; active: boolean }[];
  className?: string;
  wrap?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "-mx-1 flex max-w-full gap-1 px-1 pb-1",
          wrap
            ? "flex-wrap"
            : "overflow-x-auto [scrollbar-width:thin] [mask-image:linear-gradient(to_right,transparent,black_0.75rem,black_calc(100%-0.75rem),transparent)]"
        )}
        role="tablist"
      >
        <div className="inline-flex min-w-min rounded-full border border-border bg-muted/80 p-1">
          {items.map((item) => (
            <Link
              key={`${item.label}:${item.href}`}
              href={item.href}
              role="tab"
              aria-selected={item.active}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors",
                item.active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-foreground/70 hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
