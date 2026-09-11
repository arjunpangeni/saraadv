"use client";

import { ArrowUp } from "lucide-react";
import { handleInPageHashClick } from "@/lib/scroll-to";

export function BackToTop() {
  return (
    <a
      href="#main-content"
      className="mt-8 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-foreground"
      onClick={(event) => handleInPageHashClick(event)}
    >
      Back to top
      <ArrowUp className="size-4" aria-hidden />
    </a>
  );
}
