"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import SmoothButton from "@/components/smoothui/smooth-button";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ROLE_SHORTCUTS: Record<string, { href: string; label: string }[]> = {
  SELLER: [{ href: "/sell/new", label: "List a business" }],
  BUYER: [{ href: "/marketplace", label: "M&A Marketplace" }],
  ENTREPRENEUR: [{ href: "/project-bank/new", label: "List your idea" }],
  INVESTOR: [{ href: "/project-bank/discover", label: "Project Bank" }],
  ADVISOR: [
    { href: "/advisor/inquiries", label: "Messages" },
    { href: "/advisor/business-setups", label: "New setups" },
    { href: "/advisor/crm", label: "Deal-flow CRM" },
    { href: "/admin/analytics", label: "Analytics" },
  ],
  ADMIN: [
    { href: "/advisor/inquiries", label: "Messages" },
    { href: "/advisor/business-setups", label: "New setups" },
    { href: "/advisor/crm", label: "Deal-flow CRM" },
    { href: "/admin/analytics", label: "Analytics" },
  ],
};

function initials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
}

/** Fixed width so session hydration cannot shift the theme toggle or hamburger. */
const AUTH_SLOT = "flex h-9 w-[5.5rem] shrink-0 items-center justify-end";

function LoginButton() {
  return (
    <SmoothButton asChild variant="candy" size="sm" className="h-9 w-full rounded-full">
      <Link href="/login">Log in</Link>
    </SmoothButton>
  );
}

export function AuthNav() {
  const { data: session, status } = useSession();

  if (status === "loading" || !session?.user) {
    return (
      <div className={AUTH_SLOT}>
        <LoginButton />
      </div>
    );
  }

  const role = session.user.role ?? "";
  const shortcuts = ROLE_SHORTCUTS[role] ?? [];

  return (
    <div className={AUTH_SLOT}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative size-9 shrink-0 rounded-full"
            aria-label="Account menu"
          >
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary text-[11px] font-semibold text-primary-foreground">
                {initials(session.user.name, session.user.email)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/dashboard">Dashboard</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/notifications">Notifications</Link>
            </DropdownMenuItem>
            {shortcuts.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href}>{item.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => signOut({ callbackUrl: "/" })}>
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
