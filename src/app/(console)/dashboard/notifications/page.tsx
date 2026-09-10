import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/console/page-header";
import { DashboardNotifications } from "@/components/console/dashboard-notifications";
import { prisma } from "@/lib/prisma";
import { pageCount, pageSkip, parsePage } from "@/lib/pagination";

const NOTICE_SIZE = 20;

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ n?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { n } = await searchParams;
  const page = parsePage(n);
  const isEntrepreneur = session.user.role === "ENTREPRENEUR";
  const isSeller = session.user.role === "SELLER";
  const isBuyer = session.user.role === "BUYER";

  const [notifications, unreadCount, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: pageSkip(page, NOTICE_SIZE),
      take: NOTICE_SIZE,
    }),
    prisma.notification.count({
      where: { userId: session.user.id, readAt: null },
    }),
    prisma.notification.count({
      where: { userId: session.user.id },
    }),
  ]);

  return (
    <main className="flex-1">
      <PageHeader
        compact
        title="Notifications"
        description={
          unreadCount > 0
            ? `${unreadCount} unread`
            : total > 0
              ? `${total} notification${total === 1 ? "" : "s"}`
              : isSeller
                ? "Updates about your listings and reviews"
                : isBuyer
                  ? "Updates about profile requests and NDA access"
                  : "Updates about your projects and reviews"
        }
      />
      <div className="container-console mx-auto max-w-5xl space-y-4 py-5">
        <DashboardNotifications
          unreadCount={unreadCount}
          page={page}
          totalPages={pageCount(total, NOTICE_SIZE)}
          items={notifications.map((item) => ({
            id: item.id,
            title: item.title,
            body: item.body,
            href: item.href,
            readAt: item.readAt?.toISOString() ?? null,
            createdAt: item.createdAt.toISOString(),
          }))}
          showEmpty
          emptyMessage={
            isEntrepreneur
              ? "You’ll be notified here when a project is approved, rejected, or the desk leaves an update."
              : isSeller
                ? "You’ll be notified here when a listing is approved, rejected, or the desk leaves an update."
                : isBuyer
                  ? "You’ll be notified here when ASAR reviews a profile request or unlocks a data room."
                  : undefined
          }
        />
      </div>
    </main>
  );
}
