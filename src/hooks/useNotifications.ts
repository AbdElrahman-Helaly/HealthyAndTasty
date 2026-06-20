import {
  getNotifications,
  markNotificationAsRead,
  sendNotification,
} from '@/services/notification.service';
import type { SendNotificationInput } from '@/types';
import { useAsync, useMutation } from './useAsync';

export function useNotifications() {
  return useAsync(getNotifications, []);
}

export function useSendNotification() {
  return useMutation((input: SendNotificationInput) => sendNotification(input));
}

export function useMarkAsRead() {
  return useMutation((id: string) => markNotificationAsRead(id).then(() => id));
}
