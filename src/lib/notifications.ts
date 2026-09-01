import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma";
import { sendAdminNotificationEmail } from "@/lib/mail";

export type NotificationPayload = {
  type: string;
  title: string;
  body?: string;
  href?: string;
  details?: Record<string, string>;
  /** Email ADMIN_NOTIFICATION_EMAIL. Defaults to true. */
  emailAdmin?: boolean;
};

export async function notifyUsers(userIds: string[], data: NotificationPayload) {
  if (userIds.length > 0) {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: data.type,
        title: data.title,
        body: data.body,
        href: data.href,
      })),
    });
  }

  if (data.emailAdmin === false) return;

  void sendAdminNotificationEmail({
    type: data.type,
    title: data.title,
    body: data.body,
    href: data.href,
    details: data.details,
  }).catch((err) => console.error("[mail] failed to email admin", err));
}

export async function notifyRoles(roles: Role[], data: NotificationPayload) {
  const users = await prisma.user.findMany({
    where: { role: { in: roles } },
    select: { id: true },
  });
  await notifyUsers(
    users.map((u) => u.id),
    data
  );
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}
