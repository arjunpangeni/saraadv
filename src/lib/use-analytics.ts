"use client";

import { useCallback, useState } from "react";

const SESSION_KEY = "sara_session_id";

function createSessionId(): string {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  if (c && typeof c.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = createSessionId();
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
