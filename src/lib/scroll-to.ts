import type { MouseEvent } from "react";

export function scrollToId(id: string, options?: ScrollIntoViewOptions) {
  const el = document.getElementById(id);
  if (!el) return false;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({
    behavior: reduced ? "auto" : "smooth",
    block: "start",
    ...options,
  });
  return el;
}

export function handleInPageHashClick(
  event: MouseEvent<HTMLAnchorElement>,
  { focus = false }: { focus?: boolean } = {}
) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const href = event.currentTarget.getAttribute("href");
  if (!href?.startsWith("#") || href.length < 2) return;
  const el = scrollToId(href.slice(1));
  if (!el) return;
  event.preventDefault();
  if (focus && el instanceof HTMLElement) {
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  }
}
