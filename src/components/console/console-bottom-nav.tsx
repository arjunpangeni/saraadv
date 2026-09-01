"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bell, Home, Inbox, Landmark, PlusCircle, Store } from "lucide-react";
import NotificationBadge from "@/components/smoothui/notification-badge";
import { useDeskCounts } from "@/hooks/use-desk-counts";
import { cn } from "@/lib/utils";

function itemsForRole(role: string | undefined, pathname: string) {
  if (role === "SELLER") {
    return [
      { href: "/dashboard", label: "Home", icon: Home, active: pathname === "/dashboard" },
      {
        href: "/dashboard/notifications",
        label: "Notifications",
        icon: Bell,
        active: pathname.startsWith("/dashboard/notifications"),
        badge: true as const,
      },
      {
        href: "/sell/new",
        label: "List",
        icon: PlusCircle,
        active: pathname.startsWith("/sell"),
      },
    ];
  }

  if (role === "BUYER") {
    return [
      { href: "/dashboard", label: "Home", icon: Home, active: pathname === "/dashboard" },
      {
        href: "/dashboard/notifications",
        label: "Notifications",
        icon: Bell,
        active: pathname.startsWith("/dashboard/notifications"),
        badge: true as const,
      },
      {
        href: "/marketplace",
        label: "Browse",
        icon: Store,
        active: pathname === "/marketplace" || pathname.startsWith("/marketplace/"),
      },
    ];
  }

  if (role === "ENTREPRENEUR") {
    return [
      { href: "/dashboard", label: "Home", icon: Home, active: pathname === "/dashboard" },
      {
        href: "/dashboard/notifications",
        label: "Notifications",
        icon: Bell,
        active: pathname.startsWith("/dashboard/notifications"),
        badge: true as const,
      },
      {
        href: "/project-bank/new",
        label: "List idea",
        icon: PlusCircle,
        active: pathname === "/project-bank/new" || pathname.startsWith("/project-bank/new/"),
      },
    ];
  }

  const action =
    role === "ADVISOR" || role === "ADMIN"
      ? { href: "/advisor/inquiries", label: "Messages", icon: Inbox, match: "/advisor/inquiries" }
      : null;

  return [
    { href: "/dashboard", label: "Home", icon: Home, active: pathname === "/dashboard" },
    {
      href: "/marketplace",
      label: "Marketplace",
      icon: Store,
      active: pathname === "/marketplace" || pathname.startsWith("/marketplace/"),
    },
    {
      href: "/project-bank/discover",
      label: "Projects",
      icon: Landmark,
      active:
        pathname.startsWith("/project-bank") &&
        !pathname.startsWith("/project-bank/new") &&
        !pathname.startsWith("/advisor/project-bank"),
    },
    ...(action
      ? [
          {
            href: action.href,
            label: action.label,
            icon: action.icon,
            active: pathname === action.match || pathname.startsWith(`${action.match}/`),
          },
        ]
      : []),
  ];
}

export function ConsoleBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { counts } = useDeskCounts();
  const items = itemsForRole(session?.user?.role, pathname);
  const unread = counts?.notifications ?? 0;

  return (
    <nav
      className="glass-panel fixed inset-x-0 bottom-0 z-40 rounded-none border-x-0 border-b-0 lg:hidden"
      aria-label="Console shortcuts"
    >
      <ul
        className={cn(
          "grid pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1",
          items.length === 2 ? "grid-cols-2" : items.length === 4 ? "grid-cols-4" : "grid-cols-3"
        )}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const showBadge = "badge" in item && item.badge;
          return (
            <li key={item.href + item.label}>
              <Link
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  item.active ? "text-brand-sky" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {showBadge ? (
                  <NotificationBadge variant="count" count={unread} ping={unread > 0}>
                    <Icon className="size-5" aria-hidden />
                  </NotificationBadge>
                ) : (
                  <Icon className="size-5" aria-hidden />
                )}
                <span className="max-w-full truncate px-0.5">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
