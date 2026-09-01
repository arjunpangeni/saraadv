"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/console/app-sidebar";
import { AppTopbar } from "@/components/console/app-topbar";
import { ConsoleBottomNav } from "@/components/console/console-bottom-nav";

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="min-h-dvh flex-1">
      <AppSidebar />
      <div
        id="main-content"
        className="relative flex min-w-0 flex-1 flex-col bg-background pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0"
      >
        <AppTopbar />
        {children}
      </div>
      <ConsoleBottomNav />
    </SidebarProvider>
  );
}
