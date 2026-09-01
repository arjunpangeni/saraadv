"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { safeCallbackUrl } from "@/lib/auth-utils";

function go(path: string) {
  window.location.replace(path);
}

export function AuthSessionSync({ callbackUrl }: { callbackUrl: string }) {
  const { update, status } = useSession();
  const next = safeCallbackUrl(callbackUrl);
  const leaving = useRef(false);

  useEffect(() => {
    if (leaving.current) return;

    if (status === "authenticated") {
      leaving.current = true;
      void (async () => {
        try {
          await update();
        } catch {
          /* continue anyway */
        }
        go(next);
      })();
      return;
    }

    if (status === "loading") return;

    const timeout = window.setTimeout(() => {
      if (leaving.current) return;
      leaving.current = true;
      go(`/login?callbackUrl=${encodeURIComponent(next)}`);
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [status, next, update]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (leaving.current) return;
      leaving.current = true;
      go(next);
    }, 8000);
    return () => window.clearTimeout(timeout);
  }, [next]);

  return (
    <p className="text-sm text-foreground/70" role="status">
      Finishing sign-in…
    </p>
  );
}
