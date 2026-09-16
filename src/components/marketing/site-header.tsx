"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

const navLinkClass =
  "relative inline-flex h-8 items-center rounded-full px-2.5 text-[0.8125rem] font-semibold tracking-wide text-foreground/80 transition-colors hover:bg-muted hover:text-foreground lg:h-9 lg:px-3.5 lg:font-heading lg:text-[0.9375rem] lg:font-medium lg:tracking-[-0.02em] lg:text-foreground/70 lg:hover:bg-transparent lg:hover:text-foreground";
const navLinkActive =
  "bg-transparent text-foreground shadow-none hover:bg-transparent hover:text-foreground after:absolute after:inset-x-2.5 after:bottom-1 after:h-0.5 after:rounded-full after:bg-primary lg:font-semibold lg:tracking-[-0.02em] lg:after:inset-x-3.5 lg:after:bottom-1.5";

function scrollPageTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const headerRef = useRef<HTMLElement>(null);
  const restoreScrollRef = useRef(true);

  useEffect(() => {
    restoreScrollRef.current = false;
    setOpen(false);
    scrollPageTop();
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;

    restoreScrollRef.current = true;
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
      window.scrollTo(0, restoreScrollRef.current ? scrollY : 0);
      document.removeEventListener("wheel", stopBackgroundScroll);
      document.removeEventListener("touchmove", stopBackgroundScroll);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function closeMenuForNavigation() {
    restoreScrollRef.current = false;
    setOpen(false);
    scrollPageTop();
  }

  function onNavClick(href: string) {
    if (isNavActive(pathname, href)) {
      scrollPageTop();
    }
  }

  return (
    <>
    <header
      ref={headerRef}
      className="fixed inset-x-0 top-0 z-50"
    >
      {open && typeof document !== "undefined"
        ? createPortal(
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40 bg-background/70 lg:hidden"
              onClick={() => setOpen(false)}
            />,
            document.body
          )
        : null}
      <nav
        className={cn(
          "header-scrolled relative transition-[background-color] duration-300",
          scrolled && "header-is-stuck"
        )}
        aria-label="Primary"
      >
        <div className="mx-auto flex h-[4.5rem] w-[min(1180px,calc(100%-1rem))] items-center justify-between gap-2 sm:h-20 sm:w-[min(1180px,calc(100%-1.5rem))] sm:gap-3 lg:h-[5.25rem]">
          <BrandLogo priority compact />

          <ul className="hidden min-w-0 list-none items-center rounded-full border border-border bg-card p-1 shadow-sm lg:flex">
            {MARKETING_SERVICES.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    scroll
                    data-active={active}
                    aria-current={active ? "page" : undefined}
                    onClick={() => onNavClick(item.href)}
                    className={cn(navLinkClass, active && navLinkActive)}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-end gap-1.5 sm:gap-2">
            <Link
              href="/marketplace"
              scroll
              data-active={isNavActive(pathname, "/marketplace")}
              aria-current={isNavActive(pathname, "/marketplace") ? "page" : undefined}
              onClick={() => onNavClick("/marketplace")}
              className={cn(
                "relative hidden rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold tracking-wide transition-colors sm:inline-flex lg:h-9 lg:items-center lg:px-3.5 lg:font-heading lg:text-[0.9375rem] lg:font-medium lg:tracking-[-0.02em]",
                isNavActive(pathname, "/marketplace")
                  ? "bg-transparent text-foreground after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:bg-primary lg:font-semibold lg:after:inset-x-3.5 lg:after:bottom-1.5"
                  : "text-foreground/80 hover:bg-muted hover:text-foreground lg:text-foreground/70 lg:hover:bg-transparent lg:hover:text-foreground"
              )}
            >
              Marketplace
            </Link>
            <ThemeToggle />
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
              className="absolute top-full right-3 z-50 mt-2 w-[min(19.25rem,calc(100%-1.5rem))] origin-top-right sm:right-6 lg:hidden"
            >
              <div
                data-mobile-menu-scroll
                className="max-h-[min(70vh,calc(100dvh-6rem))] overflow-y-auto overscroll-contain"
              >
                <MobileMenuPanel onNavigate={closeMenuForNavigation} />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </nav>
    </header>
    <div className="h-[4.5rem] sm:h-20 lg:h-[5.25rem]" aria-hidden />
    </>
  );
}
