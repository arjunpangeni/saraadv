"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function useHideOnScrollDown({
  threshold = 8,
  topReveal = 24,
}: {
  threshold?: number;
  topReveal?: number;
} = {}) {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(false);
  }, [pathname]);

  useEffect(() => {
    let lastY = Math.max(0, window.scrollY);
    let ticking = false;

    const update = () => {
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY;

      const remaining =
        document.documentElement.scrollHeight - window.innerHeight - y;

      if (y <= topReveal || remaining < 96) {
        setHidden(false);
      } else if (delta > threshold) {
        setHidden(true);
      } else if (delta < -threshold) {
        setHidden(false);
      }

      lastY = y;
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold, topReveal]);

  return hidden;
}
