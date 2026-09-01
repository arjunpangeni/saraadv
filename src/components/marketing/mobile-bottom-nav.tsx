"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Home, Landmark, Store } from "lucide-react";
import { isNavActive } from "@/lib/marketing-nav";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Home", icon: Home, match: "exact" as const },
  { href: "/marketplace", label: "Marketplace", icon: Store, match: "prefix" as const },
  { href: "/project-bank", label: "Projects", icon: Landmark, match: "prefix" as const },
  { href: "/start-a-business", label: "Setup", icon: Briefcase, match: "prefix" as const },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="glass-panel fixed inset-x-0 bottom-0 z-40 rounded-none border-x-0 border-b-0 lg:hidden"
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
                  active ? "text-brand-sky" : "text-muted-foreground hover:text-foreground"
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
