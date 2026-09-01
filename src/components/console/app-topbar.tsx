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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-[var(--nav-glass)] px-4 backdrop-blur-md sm:h-[4.25rem] sm:px-6">
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
        <ThemeToggle className="size-9 rounded-full border-0 bg-transparent shadow-none hover:bg-black/[0.04] dark:hover:bg-white/10" />
        <AuthNav />
      </div>
    </header>
  );
}
