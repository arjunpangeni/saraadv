"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { useState } from "react";
import { ThemeColorMeta } from "@/components/theme-color-meta";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { DevPointerCaptureGuard } from "@/components/dev-pointer-capture-guard";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <ThemeProvider>
      <DevPointerCaptureGuard />
      <ThemeColorMeta />
      <TooltipProvider>
        <SessionProvider>
          <QueryClientProvider client={queryClient}>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </QueryClientProvider>
        </SessionProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
