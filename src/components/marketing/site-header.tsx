"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Menu, X } from "lucide-react";
import { AuthNav } from "@/components/marketing/auth-nav";
import { BrandLogo } from "@/components/brand-logo";
import { MobileMenuPanel } from "@/components/marketing/mobile-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MARKETING_SERVICES, isNavActive } from "@/lib/marketing-nav";
import { cn } from "@/lib/utils";

const EASE_OUT_QUART = [0.22, 1, 0.36, 1] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const { body, documentElement } = document;
    const previous = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      htmlOverflow: documentElement.style.overflow,
    };

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    documentElement.style.overflow = "hidden";

    const menuRoot = headerRef.current;
    const stopBackgroundScroll = (event: WheelEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && menuRoot?.contains(target)) {
        const scroller = (target as Element).closest("[data-mobile-menu-scroll]");
        if (scroller && scroller.scrollHeight > scroller.clientHeight) return;
      }
      event.preventDefault();
    };

    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (headerRef.current && !headerRef.current.contains(target)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("wheel", stopBackgroundScroll, { passive: false });
    document.addEventListener("touchmove", stopBackgroundScroll, { passive: false });
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);

    return () => {
      body.style.overflow = previous.bodyOverflow;
      body.style.position = previous.bodyPosition;
      body.style.top = previous.bodyTop;
      body.style.width = previous.bodyWidth;
      documentElement.style.overflow = previous.htmlOverflow;
      window.scrollTo(0, scrollY);
      document.removeEventListener("wheel", stopBackgroundScroll);
      document.removeEventListener("touchmove", stopBackgroundScroll);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="h-16 lg:h-[4.75rem]">
      <nav
        ref={headerRef}
        className="fixed top-3 left-1/2 z-50 w-full max-w-[1280px] -translate-x-1/2 px-3 sm:px-6 lg:px-8"
        aria-label="Primary"
      >
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-full border border-border bg-[var(--nav-glass)] px-2 py-1.5 shadow-sm sm:gap-3 sm:px-3">
          <div className="flex min-w-0 items-center">
            <BrandLogo priority compact />
          </div>

          <ul className="hidden min-w-0 list-none items-center justify-center justify-self-center rounded-full bg-black/[0.04] p-1 dark:bg-white/[0.06] lg:flex">
            {MARKETING_SERVICES.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    data-active={active}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-full px-3 py-2 text-sm font-medium leading-none whitespace-nowrap outline-none transition-colors",
                      active
                        ? "bg-[var(--nav-glass)] text-foreground shadow-sm dark:bg-white/10 dark:shadow-none"
                        : "text-foreground/70 hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/10"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            <Link
              href="/marketplace"
              data-active={isNavActive(pathname, "/marketplace")}
              aria-current={isNavActive(pathname, "/marketplace") ? "page" : undefined}
              className={cn(
                "hidden rounded-full px-3 py-2 text-sm font-medium leading-none whitespace-nowrap transition-colors sm:inline-flex",
                isNavActive(pathname, "/marketplace")
                  ? "bg-black/[0.04] text-foreground dark:bg-white/10"
                  : "text-foreground/70 hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/10"
              )}
            >
              Marketplace
            </Link>
            <ThemeToggle className="mr-2 size-9 rounded-full border-0 bg-transparent shadow-none hover:bg-black/[0.04] dark:hover:bg-white/10 lg:mr-0" />
            <AuthNav />
            <button
              type="button"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              className="relative z-20 flex size-9 cursor-pointer items-center justify-center rounded-full text-foreground outline-none hover:bg-muted lg:hidden"
              onClick={() => setOpen((value) => !value)}
            >
              <AnimatePresence initial={false} mode="wait">
                {open ? (
                  <motion.span
                    key="close"
                    className="flex"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, rotate: 180, scale: 0 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, rotate: 0, scale: 1 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, rotate: -180, scale: 0 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT_QUART }}
                  >
                    <X className="size-5" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    className="flex"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, rotate: -180, scale: 0 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, rotate: 0, scale: 1 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, rotate: 180, scale: 0 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT_QUART }}
                  >
                    <Menu className="size-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open ? (
            <motion.div
              key="mobile-menu"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: -10 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 0, transition: { duration: 0 } }
                  : { opacity: 0, scale: 0.95, y: -10 }
              }
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT_QUART }}
              className="absolute top-full right-3 left-3 z-50 mt-2 origin-top sm:right-6 sm:left-6 lg:hidden"
            >
              <div
                data-mobile-menu-scroll
                className="max-h-[min(70vh,calc(100dvh-6rem))] overflow-y-auto overscroll-contain"
              >
                <MobileMenuPanel onNavigate={() => setOpen(false)} />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </nav>
    </header>
  );
}
