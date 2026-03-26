import { createContext } from 'react';
import type { Notification } from '../types/notification';

export interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: (page?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  removeNotification: (id: string) => void;
}

export const NotificationContext = createContext<NotificationContextValue | null>(null);
