"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Store,
  Landmark,
  Briefcase,
  Building2,
  BarChart3,
  PlusCircle,
  Inbox,
  ClipboardList,
  Lightbulb,
  Bell,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import SmoothButton from "@/components/smoothui/smooth-button";
import NotificationBadge from "@/components/smoothui/notification-badge";
import { useDeskCounts } from "@/hooks/use-desk-counts";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type CountKey = "inquiries" | "setups" | "listings" | "ideas" | "notifications";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  countKey?: CountKey;
  badge?: "count";
};

const COMMON: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/project-bank/discover", label: "Project Bank", icon: Landmark },
];

const OWNER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/dashboard/notifications",
    label: "Notifications",
    icon: Bell,
    countKey: "notifications",
    badge: "count",
  },
];

const ROLE_NAV: Record<string, NavItem[]> = {
  SELLER: [{ href: "/sell/new", label: "List a business", icon: PlusCircle }],
  BUYER: [{ href: "/marketplace", label: "Browse marketplace", icon: Store }],
  ENTREPRENEUR: [{ href: "/project-bank/new", label: "List your idea", icon: PlusCircle }],
  INVESTOR: [],
  ADVISOR: [
    { href: "/advisor/inquiries", label: "Inquiries", icon: Inbox, countKey: "inquiries" },
    { href: "/advisor/business-setups", label: "New setups", icon: Building2, countKey: "setups" },
    { href: "/advisor/listings", label: "Sale requests", icon: ClipboardList, countKey: "listings" },
    { href: "/advisor/project-bank", label: "Project Idea", icon: Lightbulb, countKey: "ideas" },
    { href: "/advisor/crm", label: "Deal-flow CRM", icon: Briefcase },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  ],
  ADMIN: [
    { href: "/advisor/inquiries", label: "Inquiries", icon: Inbox, countKey: "inquiries" },
    { href: "/advisor/business-setups", label: "New setups", icon: Building2, countKey: "setups" },
    { href: "/advisor/listings", label: "Sale requests", icon: ClipboardList, countKey: "listings" },
    { href: "/advisor/project-bank", label: "Project Idea", icon: Lightbulb, countKey: "ideas" },
    { href: "/advisor/crm", label: "Deal-flow CRM", icon: Briefcase },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  ],
};

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavGroup({
  title,
  items,
  counts,
}: {
  title: string;
  items: NavItem[];
  counts?: Record<string, number> | null;
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  if (items.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sm font-medium tracking-tight">
        {title}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            const count = item.countKey ? counts?.[item.countKey] : undefined;
            const unread = count ?? 0;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.label} className="min-h-10 overflow-visible">
                  <Link
                    href={item.href}
                    onClick={() => isMobile && setOpenMobile(false)}
                    aria-label={
                      item.badge === "count" && unread > 0
                        ? `${item.label}, ${unread} unread`
                        : item.label
                    }
                  >
                    {item.badge === "count" ? (
                      <NotificationBadge variant="count" count={unread} ping={unread > 0}>
                        <Icon className="size-4 shrink-0" />
                      </NotificationBadge>
                    ) : (
                      <Icon />
                    )}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
                {item.badge !== "count" && typeof count === "number" && count > 0 ? (
                  <SidebarMenuBadge className="bg-brand-sky-muted text-brand-sky">
                    {count}
                  </SidebarMenuBadge>
                ) : null}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { data: session } = useSession();
  const { isMobile, setOpenMobile } = useSidebar();
  const { counts } = useDeskCounts();
  const role = session?.user?.role ?? "";
  const deskItems = ROLE_NAV[role] ?? [];
  const isDesk = role === "ADVISOR" || role === "ADMIN";
  const isOwnerHome = role === "SELLER" || role === "BUYER" || role === "ENTREPRENEUR";
  const workspaceItems = isOwnerHome
    ? OWNER_NAV
    : isDesk
      ? COMMON.filter((item) => item.href === "/dashboard")
      : COMMON;

  return (
    <Sidebar collapsible="offcanvas" className="border-sidebar-border">
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border px-3 sm:h-[4.25rem]">
        <BrandLogo priority compact />
      </SidebarHeader>
      <SidebarContent>
        <NavGroup title="Workspace" items={workspaceItems} counts={counts} />
        {isDesk && <NavGroup title="Advisor desk" items={deskItems} counts={counts} />}
        {!isDesk && deskItems.length > 0 && <NavGroup title="Actions" items={deskItems} />}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SmoothButton asChild variant="outline" size="sm" className="w-full">
          <Link href="/" onClick={() => isMobile && setOpenMobile(false)}>
            Back to home
          </Link>
        </SmoothButton>
      </SidebarFooter>
    </Sidebar>
  );
}
