"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-8 w-[3.65rem] shrink-0 items-center rounded-full border border-border/70 bg-muted/50 p-0.5",
        "transition-colors hover:border-border focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-0.5 left-0.5 size-7 rounded-full bg-background shadow-sm ring-1 ring-border/60 transition-transform duration-300 ease-out",
          isDark && "translate-x-[1.65rem]"
        )}
      />
      <span className="relative z-10 grid w-[1.575rem] place-items-center">
        <Sun
          className={cn(
            "size-3.5 transition-colors duration-300",
            isDark ? "text-foreground/50" : "text-tz-gold"
          )}
        />
      </span>
      <span className="relative z-10 grid w-[1.575rem] place-items-center">
        <Moon
          className={cn(
            "size-3.5 transition-colors duration-300",
            isDark ? "text-tz-blue-deep" : "text-foreground/50"
          )}
        />
      </span>
    </button>
  );
}
