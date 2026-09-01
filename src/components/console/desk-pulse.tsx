"use client";

import Link from "next/link";
import { Inbox, Building2, ClipboardList, Lightbulb } from "lucide-react";
import { useDeskCounts } from "@/hooks/use-desk-counts";
import { cn } from "@/lib/utils";

const ITEMS = [
  { key: "inquiries" as const, href: "/advisor/inquiries?status=NEW", label: "Inquiries", icon: Inbox },
  { key: "setups" as const, href: "/advisor/business-setups", label: "Setups", icon: Building2 },
  { key: "listings" as const, href: "/advisor/listings?status=PENDING_REVIEW", label: "Sale requests", icon: ClipboardList },
  { key: "ideas" as const, href: "/advisor/project-bank?tab=review", label: "Project Idea", icon: Lightbulb },
];

export function DeskPulse() {
  const { counts, isDesk } = useDeskCounts();
  if (!isDesk) return null;

  return (
    <nav aria-label="New desk items" className="hidden min-w-0 items-center gap-1.5 md:flex">
      {ITEMS.map((item) => {
        const n = counts?.[item.key] ?? 0;
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium tracking-tight tabular-nums transition-colors",
              n > 0
                ? "bg-brand-sky-muted text-brand-sky"
                : "text-foreground/60 hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/10"
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            <span className="hidden xl:inline">{item.label}</span>
            <span>{n}</span>
          </Link>
        );
      })}
    </nav>
  );
}
