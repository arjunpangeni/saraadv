"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export type DeskCounts = {
  inquiries: number;
  setups: number;
  listings: number;
  ideas: number;
  notifications: number;
};

export function useDeskCounts() {
  const { data: session, status } = useSession();
  const [counts, setCounts] = useState<DeskCounts | null>(null);
  const isDesk = session?.user?.role === "ADVISOR" || session?.user?.role === "ADMIN";
  const isOwnerHome =
    session?.user?.role === "ENTREPRENEUR" ||
    session?.user?.role === "SELLER" ||
    session?.user?.role === "BUYER";
  const enabled = isDesk || isOwnerHome;

  const load = useCallback(async () => {
    if (!enabled) return;
    const res = await fetch("/api/desk-counts");
    if (!res.ok) return;
    const data = (await res.json()) as DeskCounts;
    setCounts(data);
  }, [enabled]);

  useEffect(() => {
    if (status !== "authenticated" || !enabled) return;
    void load();
    const id = window.setInterval(() => void load(), 45_000);
    const onRefresh = () => void load();
    window.addEventListener("asar:desk-counts", onRefresh);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("asar:desk-counts", onRefresh);
    };
  }, [status, enabled, load]);

  return { counts, isDesk, refresh: load };
}
