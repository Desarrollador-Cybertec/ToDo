import { sileo } from 'sileo';
import type { Notification, NotificationType } from '../types/notification';
import { NOTIFICATION_CONFIG } from '../types/notification';

const TOAST_METHOD: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
  task_assigned: 'info',
  task_delegated: 'info',
  task_submitted_for_review: 'info',
  task_approved: 'success',
  task_rejected: 'error',
  task_completed: 'success',
  task_cancelled: 'warning',
  task_reopened: 'info',
  task_comment: 'info',
  task_due_soon: 'warning',
  task_overdue: 'error',
  inactivity_alert: 'warning',
  daily_summary: 'info',
};

export function showNotificationToast(notification: Notification) {
  const slug = notification.data.type;
  const config = NOTIFICATION_CONFIG[slug as NotificationType];
  const method = TOAST_METHOD[slug] ?? 'info';
  const emoji = config?.emoji ?? '🔔';
  const label = config?.label ?? 'Notificación';

  sileo[method]({
    title: `${emoji} ${label}`,
    description: notification.data.message,
    duration: 6000,
  });
}
