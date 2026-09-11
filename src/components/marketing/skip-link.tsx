"use client";

import { handleInPageHashClick } from "@/lib/scroll-to";

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
      onClick={(event) => handleInPageHashClick(event, { focus: true })}
    >
      Skip to content
    </a>
  );
}
