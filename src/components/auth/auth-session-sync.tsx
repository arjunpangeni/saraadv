"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { safeCallbackUrl } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";

function go(path: string) {
  window.location.replace(path);
}

type SyncPhase = "working" | "unauthenticated" | "timeout" | "failed";

export function AuthSessionSync({ callbackUrl }: { callbackUrl: string }) {
  const { update, status } = useSession();
  const next = safeCallbackUrl(callbackUrl);
  const leaving = useRef(false);
  const [phase, setPhase] = useState<SyncPhase>("working");

  useEffect(() => {
    if (leaving.current || phase !== "working") return;

    if (status === "authenticated") {
      leaving.current = true;
      void (async () => {
        try {
          await update();
          go(next);
        } catch {
          leaving.current = false;
          setPhase("failed");
        }
      })();
      return;
    }

    if (status === "loading") return;

    const timeout = window.setTimeout(() => {
      if (leaving.current) return;
      setPhase("unauthenticated");
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [status, next, update, phase]);

  useEffect(() => {
    if (phase !== "working") return;

    const timeout = window.setTimeout(() => {
      if (leaving.current) return;
      setPhase("timeout");
    }, 8000);

    return () => window.clearTimeout(timeout);
  }, [phase]);

  if (phase === "unauthenticated") {
    const loginHref = `/login?callbackUrl=${encodeURIComponent(next)}`;
    return (
      <div className="space-y-4" role="alert">
        <p className="text-sm text-foreground/80">
          We could not confirm your session. Sign in again to continue.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="sky">
            <Link href={loginHref}>Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "timeout" || phase === "failed") {
    return (
      <div className="space-y-4" role="alert">
        <p className="text-sm text-foreground/80">
          {phase === "failed"
            ? "Sign-in finished, but we could not refresh your session."
            : "Sign-in is taking longer than expected."}{" "}
          You can open your workspace, try again, or return home.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="sky" onClick={() => go(next)}>
            Continue
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              leaving.current = false;
              setPhase("working");
            }}
          >
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <p className="text-sm text-foreground/70" role="status" aria-live="polite">
      Finishing sign-in…
    </p>
  );
}
