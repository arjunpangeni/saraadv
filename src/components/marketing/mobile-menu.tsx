"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeftRight,
  Building2,
  Home,
  Info,
  Landmark,
  Leaf,
  LayoutDashboard,
  Store,
  TrendingUp,
} from "lucide-react";
import SmoothButton from "@/components/smoothui/smooth-button";
import { MARKETING_SERVICES, isNavActive } from "@/lib/marketing-nav";
import { cn } from "@/lib/utils";

const EXPLORE = [
  { href: "/", label: "Home", icon: Home, match: "exact" as const },
  { href: "/marketplace", label: "Marketplace", icon: Store, match: "prefix" as const },
  { href: "/project-bank/discover", label: "Discover projects", icon: Landmark, match: "prefix" as const },
  { href: "/about", label: "About", icon: Info, match: "prefix" as const },
];

const SERVICE_ICONS = {
  "/start-a-business": Building2,
  "/buy-sell": ArrowLeftRight,
  "/asset-management": TrendingUp,
  "/project-bank": Landmark,
  "/carbon-finance": Leaf,
} as const;

export function MobileMenuPanel({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const signedIn = status === "authenticated" && Boolean(session?.user);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="rounded-2xl border border-border bg-[var(--nav-glass)] p-4 shadow-lg">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.05, duration: 0.2 }}
        className="mb-5"
      >
        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground/70">Explore</p>
        <div className="flex flex-col">
          {EXPLORE.map((item) => (
            <MenuLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isNavActive(pathname, item.href, item.match)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.1, duration: 0.2 }}
        className="mb-5"
      >
        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground/70">Advisory</p>
        <div className="flex flex-col">
          {MARKETING_SERVICES.map((item) => {
            const Icon = SERVICE_ICONS[item.href];
            return (
              <MenuLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={Icon}
                active={isNavActive(pathname, item.href)}
                onNavigate={onNavigate}
              />
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.2, duration: 0.2 }}
        className="border-t border-border/60 pt-4"
      >
        {signedIn ? (
          <SmoothButton asChild variant="candy" size="sm" className="w-full">
            <Link href="/dashboard" onClick={onNavigate}>
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
          </SmoothButton>
        ) : (
          <SmoothButton asChild variant="candy" size="sm" className="w-full">
            <Link href="/login" onClick={onNavigate}>
              Log in
            </Link>
          </SmoothButton>
        )}
      </motion.div>
    </div>
  );
}

function MenuLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active ? "bg-muted text-foreground" : "text-foreground hover:bg-muted"
      )}
    >
      <Icon className="size-4 text-foreground/70" aria-hidden />
      {label}
    </Link>
  );
}
