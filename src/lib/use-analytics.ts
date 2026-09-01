"use client";

import { useCallback, useState } from "react";

const SESSION_KEY = "sara_session_id";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function useAnalytics() {
  const [sessionId] = useState<string>(() => getOrCreateSessionId());

  const track = useCallback(
    (type: string, opts?: { entityType?: string; entityId?: string; metadata?: Record<string, unknown> }) => {
      const id = getOrCreateSessionId();
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          sessionId: id,
          path: typeof window !== "undefined" ? window.location.pathname : undefined,
          ...opts,
        }),
      }).catch(() => {});
    },
    []
  );

  return { sessionId, track };
}
