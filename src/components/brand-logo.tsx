"use client";

import type { MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  href?: string | null;
  className?: string;
  markClassName?: string;
  priority?: boolean;
  linked?: boolean;
  invertOnDarkPanel?: boolean;
  showTagline?: boolean;
  /** Compact lockup for sticky headers / sidebars */
  compact?: boolean;
}

export function BrandLogo({
  href = "/",
  className,
  markClassName,
  priority = false,
  linked = true,
  compact = false,
}: BrandLogoProps) {
  const pathname = usePathname();
  const dest = href || "/";

  function goHomeTop(event: MouseEvent<HTMLAnchorElement>) {
    if (dest !== "/") return;
    if (pathname === "/") {
      event.preventDefault();
    }
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }

  const markClass = cn(
    "relative z-10 w-auto shrink-0 origin-center scale-[1.2] object-contain",
    compact
      ? "h-16 sm:h-[4.5rem] md:h-20 lg:h-[5.25rem]"
      : "h-20 sm:h-24 md:h-28",
    markClassName
  );

  const mark = (
    <span
      className={cn(
        "relative isolate inline-flex shrink-0 items-center justify-center",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "brand-logo-wash pointer-events-none absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2",
          compact ? "h-52 w-56 sm:h-56 sm:w-60" : "h-60 w-64 sm:h-64 sm:w-72"
        )}
      />
      <Image
        src="/logo2.png?v=5"
        alt=""
        width={500}
        height={500}
        sizes="(max-width: 639px) 80px, (max-width: 767px) 88px, (max-width: 1023px) 96px, 112px"
        className={cn(markClass, "brand-logo-light")}
        style={{ width: "auto" }}
        priority={priority}
        unoptimized
      />
      <Image
        src="/logolight.png?v=1"
        alt=""
        width={1024}
        height={1024}
        sizes="(max-width: 639px) 80px, (max-width: 767px) 88px, (max-width: 1023px) 96px, 112px"
        className={cn(markClass, "brand-logo-dark")}
        style={{ width: "auto" }}
        priority={priority}
        unoptimized
      />
    </span>
  );

  if (!linked || href === null) return mark;
  return (
    <Link
      href={dest}
      scroll
      onClick={goHomeTop}
      className="inline-flex shrink-0 items-center"
      aria-label="ASAR Partners home"
    >
      {mark}
    </Link>
  );
}
