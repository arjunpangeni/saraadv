"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Home, Landmark, Store, type LucideIcon } from "lucide-react";
import { useHideOnScrollDown } from "@/hooks/use-hide-on-scroll-down";
import { isNavActive } from "@/lib/marketing-nav";
import { cn } from "@/lib/utils";

const ITEMS: {
  href: string;
  label: string;
  icon: LucideIcon;
  match: "exact" | "prefix";
  accent: string;
  soft: string;
}[] = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    match: "exact",
    accent: "text-tz-blue-deep",
    soft: "bg-[color-mix(in_srgb,var(--tz-blue-deep)_22%,var(--tz-blue))]",
  },
  {
    href: "/marketplace",
    label: "Marketplace",
    icon: Store,
    match: "prefix",
    accent: "text-tz-gold",
    soft: "bg-[color-mix(in_srgb,var(--tz-gold)_38%,transparent)]",
  },
  {
    href: "/project-bank",
    label: "Projects",
    icon: Landmark,
    match: "prefix",
    accent: "text-tz-pink-deep",
    soft: "bg-[color-mix(in_srgb,var(--tz-pink-deep)_20%,var(--tz-pink))]",
  },
  {
    href: "/start-a-business",
    label: "New setup",
    icon: Briefcase,
    match: "prefix",
    accent: "text-tz-green-deep",
    soft: "bg-[color-mix(in_srgb,var(--tz-green-deep)_22%,var(--tz-green))]",
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const hidden = useHideOnScrollDown();

  function onNavClick(href: string, match: "exact" | "prefix") {
    if (isNavActive(pathname, href, match)) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }

  return (
    <nav
      className={cn(
        "mobile-bottom-nav mobile-chrome fixed inset-x-0 bottom-0 z-40 rounded-none border-x-0 border-b-0 border-t transition-transform duration-300 ease-out motion-reduce:transition-none lg:hidden",
        hidden && "pointer-events-none translate-y-full"
      )}
      aria-hidden={hidden}
      aria-label="Primary mobile"
    >
      <ul className="grid grid-cols-4 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1">
        {ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href, item.match);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                scroll
                aria-current={active ? "page" : undefined}
                tabIndex={hidden ? -1 : undefined}
                onClick={() => onNavClick(item.href, item.match)}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-semibold text-foreground transition-colors",
                  active ? "opacity-100" : "opacity-90 hover:opacity-100"
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-8 items-center justify-center rounded-full ring-1 transition-[background-color,transform,box-shadow] duration-200",
                    item.accent,
                    item.soft,
                    active
                      ? "scale-105 ring-[color-mix(in_srgb,currentColor_45%,transparent)] shadow-sm"
                      : "ring-[color-mix(in_srgb,currentColor_28%,transparent)]"
                  )}
                >
                  <Icon className="size-5 stroke-[2.25]" aria-hidden />
                </span>
                <span className="max-w-full truncate px-0.5 text-foreground">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
