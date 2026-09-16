"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import SmoothButton from "@/components/smoothui/smooth-button";
import { DashboardEmpty, DashboardPanel, DashboardRow } from "@/components/console/dashboard-panel";
import { PagePagination } from "@/components/console/page-pagination";

export type DashboardNotification = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export function DashboardNotifications({
  items,
  unreadCount,
  page,
  totalPages,
  className,
  showEmpty,
  emptyMessage,
}: {
  items: DashboardNotification[];
  unreadItems?: DashboardNotification[];
  unreadCount: number;
  page: number;
  totalPages: number;
  className?: string;
  showEmpty?: boolean;
  emptyMessage?: string;
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(items);
  const [unread, setUnread] = useState(unreadCount);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNotifications(items);
    setUnread(unreadCount);
  }, [items, unreadCount]);

  if (notifications.length === 0 && unread === 0 && !showEmpty) return null;

  async function markRead(ids?: string[]) {
    setBusy(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids?.length ? { ids } : {}),
      });
      const now = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) => {
          if (n.readAt) return n;
          if (!ids?.length || ids.includes(n.id)) return { ...n, readAt: now };
          return n;
        })
      );
      setUnread((c) => (ids?.length ? Math.max(0, c - ids.length) : 0));
      window.dispatchEvent(new Event("asar:desk-counts"));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function openNotification(n: DashboardNotification) {
    if (!n.readAt) await markRead([n.id]);
  }

  return (
    <DashboardPanel
      id="notifications"
      className={className}
      title="Notifications"
      description={unread > 0 ? `${unread} unread` : "Caught up"}
      action={
        unread > 0 ? (
          <SmoothButton type="button" variant="outline" size="sm" disabled={busy} onClick={() => void markRead()}>
            Mark read
          </SmoothButton>
        ) : null
      }
    >
      {notifications.length === 0 ? (
        <DashboardEmpty>
          {showEmpty
            ? (emptyMessage ??
              "You’ll be notified here when a listing is approved, rejected, or the desk leaves a suggestion.")
            : "No notifications yet."}
        </DashboardEmpty>
      ) : (
        <div className="divide-y divide-border-subtle">
          {notifications.map((n) => (
            <DashboardRow
              key={n.id}
              href={n.href ?? undefined}
              title={n.title}
              meta={[n.body, new Date(n.createdAt).toLocaleString()].filter(Boolean).join(" · ")}
              onClick={n.href ? () => void openNotification(n) : undefined}
              badge={n.readAt ? undefined : <Badge variant="sky">New</Badge>}
            />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="px-3 pb-3">
          <PagePagination page={page} totalPages={totalPages} param="n" />
        </div>
      ) : null}
    </DashboardPanel>
  );
}
