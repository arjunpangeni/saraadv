"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Home, Landmark, Store } from "lucide-react";
import { useHideOnScrollDown } from "@/hooks/use-hide-on-scroll-down";
import { isNavActive } from "@/lib/marketing-nav";
import { cn } from "@/lib/utils";
import { RemoveScroll } from "react-remove-scroll";

const ITEMS = [
  { href: "/", label: "Home", icon: Home, match: "exact" as const },
  { href: "/marketplace", label: "Marketplace", icon: Store, match: "prefix" as const },
  { href: "/project-bank", label: "Projects", icon: Landmark, match: "prefix" as const },
  { href: "/start-a-business", label: "Setup", icon: Briefcase, match: "prefix" as const },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const hidden = useHideOnScrollDown();

  return (
    <nav
      className={cn(
        "mobile-chrome fixed inset-x-0 bottom-0 z-40 rounded-none border-x-0 border-b-0 border-t transition-transform duration-300 ease-out motion-reduce:transition-none lg:hidden",
        RemoveScroll.classNames.fullWidth,
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
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span className="max-w-full truncate px-0.5">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
