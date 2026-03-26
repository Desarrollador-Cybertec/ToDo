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
  const initializedRef = useRef(false);

  /**
   * Solo carga y muestra notificaciones — NO dispara toasts ni toca knownIdsRef.
   * Usar para: abrir el panel, cargar la página de notificaciones.
   */
  const fetchNotifications = useCallback(async (page = 1) => {
    if (!getToken()) return;
    try {
      setIsLoading(true);
      const response = await notificationsApi.list(page);
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Detecta notificaciones nuevas respecto a knownIdsRef, dispara toasts
   * y actualiza el estado. Llamar solo desde el polling.
   */
  const checkAndToastNew = useCallback(async () => {
    if (!getToken()) return;
    try {
      const response = await notificationsApi.list();
      const incoming = response.data;

      for (const notif of incoming) {
        if (!knownIdsRef.current.has(notif.id) && !notif.read_at) {
          showNotificationToast(notif);
        }
      }

      knownIdsRef.current = new Set(incoming.map((n) => n.id));
      setNotifications(incoming);
    } catch (error) {
      console.error('Error checking new notifications:', error);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!getToken()) return;
    try {
      const response = await notificationsApi.getUnreadCount();
      const newCount = response.unread_count;

      if (prevUnreadCountRef.current !== null && newCount > prevUnreadCountRef.current) {
        // Hay notificaciones nuevas: comparar IDs y disparar toasts
        checkAndToastNew();
      }

      prevUnreadCountRef.current = newCount;
      setUnreadCount(newCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [checkAndToastNew]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, read_at: new Date().toISOString() } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      // Mantener knownIdsRef actualizado
      knownIdsRef.current.add(id);
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

  // Inicialización: sembrar knownIdsRef con las notificaciones actuales (sin toasts)
  useEffect(() => {
    if (initializedRef.current || !getToken()) return;
    initializedRef.current = true;

    notificationsApi.list().then((response) => {
      knownIdsRef.current = new Set(response.data.map((n) => n.id));
      setNotifications(response.data);
    }).catch(() => {});
  }, []);

  // Polling cada 15 segundos para el contador de no leídas.
  // El primer tick lo saltamos si la inicialización ya terminó (evita doble llamada en mount).
  useEffect(() => {
    if (!getToken()) return;
    // Pequeño delay para que la inicialización termine primero
    const initialTimeout = setTimeout(() => {
      fetchUnreadCount();
    }, 1000);
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [fetchUnreadCount]);

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
