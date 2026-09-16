"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { AuthNav } from "@/components/marketing/auth-nav";
import { DeskPulse } from "@/components/console/desk-pulse";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import SmoothButton from "@/components/smoothui/smooth-button";

export function AppTopbar() {
  return (
    <header className="header-scrolled header-is-stuck sticky top-0 z-[70] flex h-[4.5rem] items-center gap-3 border-b border-border/40 px-4 sm:h-20 sm:px-6">
      <SidebarTrigger className="size-9 shrink-0 rounded-full text-foreground hover:bg-black/[0.04] dark:hover:bg-white/10 lg:hidden" />
      <div className="min-w-0 flex-1">
        <div className="lg:hidden">
          <BrandLogo compact href="/dashboard" />
        </div>
        <div className="hidden lg:block">
          <DeskPulse />
        </div>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <SmoothButton asChild variant="outline" size="sm" className="lg:hidden">
          <Link href="/">Back to home</Link>
        </SmoothButton>
        <ThemeToggle />
        <AuthNav />
      </div>
    </header>
  );
}
