"use client";

import { useEffect } from "react";

/**
 * Next.js DevTools can call releasePointerCapture after a mobile tap/long-press
 * has already ended. Chrome then throws NotFoundError. Swallow only that case.
 */
export function DevPointerCaptureGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const proto = Element.prototype;
    const original = proto.releasePointerCapture;

    proto.releasePointerCapture = function releasePointerCaptureSafe(pointerId) {
      if (typeof this.hasPointerCapture === "function" && !this.hasPointerCapture(pointerId)) {
        return;
      }
      try {
        original.call(this, pointerId);
      } catch {
        /* pointer already released */
      }
    };

    return () => {
      proto.releasePointerCapture = original;
    };
  }, []);

  return null;
}
