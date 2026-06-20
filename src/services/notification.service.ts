import { mockNotifications } from '@/data/mockNotifications';
import { api } from '@/lib/api';
import type { Notification, SendNotificationInput } from '@/types';

let localNotifications = [...mockNotifications];

export async function getNotifications(): Promise<Notification[]> {
  try {
    const notifications = await api.notifications.list();
    if (notifications.length > 0) {
      localNotifications = notifications;
      return notifications;
    }
  } catch {
    // API not available — return local/mock data silently
  }
  return localNotifications;
}

export async function sendNotification(input: SendNotificationInput): Promise<Notification> {
  try {
    return await api.notifications.send(input);
  } catch {
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      title: input.title,
      message: input.message,
      isRead: false,
      createdAt: new Date().toISOString(),
      targetType: input.targetType,
      targetId: input.targetId,
      targetLabel:
        input.targetType === 'all'
          ? 'All Branches'
          : input.targetId ?? input.targetType,
    };
    localNotifications = [notification, ...localNotifications];
    return notification;
  }
}

export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    await api.notifications.markAsRead(id);
  } catch {
    /* local update */
  }
  localNotifications = localNotifications.map((n) =>
    n.id === id ? { ...n, isRead: true } : n,
  );
}

export async function getUnreadCount(): Promise<number> {
  const notifications = await getNotifications();
  return notifications.filter((n) => !n.isRead).length;
}
