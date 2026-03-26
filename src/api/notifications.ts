import { apiClient } from './client';
import type {
  Notification,
  NotificationPaginatedResponse,
  NotificationUnreadCountResponse,
} from '../types/notification';

export const notificationsApi = {
  /**
   * Listar notificaciones paginadas
   * GET /api/notifications?page=1
   */
  list: (page = 1) =>
    apiClient.getPage<NotificationPaginatedResponse>(
      `/notifications${page > 1 ? `?page=${page}` : ''}`
    ),

  /**
   * Obtener contador de notificaciones no leídas
   * GET /api/notifications/unread-count
   */
  getUnreadCount: () =>
    apiClient.get<NotificationUnreadCountResponse>('/notifications/unread-count'),

  /**
   * Marcar una notificación como leída
   * PATCH /api/notifications/{id}/read
   */
  markAsRead: (id: string) =>
    apiClient.patch<Notification>(`/notifications/${id}/read`),

  /**
   * Marcar todas las notificaciones como leídas
   * POST /api/notifications/read-all
   */
  markAllAsRead: () =>
    apiClient.post<{ message: string }>('/notifications/read-all'),
};
