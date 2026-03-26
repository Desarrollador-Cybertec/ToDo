import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { notificationsApi } from '../api/notifications';
import { getToken } from '../api/client';
import type { Notification } from '../types/notification';
import { NotificationContext } from './notificationContextDef';
import { showNotificationToast } from '../utils/notificationToast';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const prevUnreadCountRef = useRef<number | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());

  const fetchNotifications = useCallback(async (page = 1) => {
    if (!getToken()) return;
    try {
      setIsLoading(true);
      const response = await notificationsApi.list(page);
      const incoming = response.data;

      // Detectar notificaciones nuevas para toasts
      if (knownIdsRef.current.size > 0) {
        for (const notif of incoming) {
          if (!knownIdsRef.current.has(notif.id) && !notif.read_at) {
            showNotificationToast(notif);
          }
        }
      }

      // Actualizar el set de IDs conocidos
      knownIdsRef.current = new Set(incoming.map((n) => n.id));
      setNotifications(incoming);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!getToken()) return;
    try {
      const response = await notificationsApi.getUnreadCount();
      const newCount = response.unread_count;

      // Si el conteo de no leídas subió, refrescar la lista para detectar las nuevas
      if (prevUnreadCountRef.current !== null && newCount > prevUnreadCountRef.current) {
        fetchNotifications();
      }

      prevUnreadCountRef.current = newCount;
      setUnreadCount(newCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, read_at: new Date().toISOString() } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          read_at: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  // Polling cada 30 segundos para obtener el contador
  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 15000); // 15 segundos

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Cargar notificaciones al montar
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
        fetchUnreadCount,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
