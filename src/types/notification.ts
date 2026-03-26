export type NotificationType =
  | 'task_assigned'
  | 'task_delegated'
  | 'task_submitted_for_review'
  | 'task_approved'
  | 'task_rejected'
  | 'task_completed'
  | 'task_cancelled'
  | 'task_reopened'
  | 'task_comment'
  | 'task_due_soon'
  | 'task_overdue'
  | 'inactivity_alert'
  | 'daily_summary';

export type NotificationCategory = 'organizational' | 'personal' | 'summary';

export interface NotificationData {
  type: NotificationType;
  category: NotificationCategory;
  message: string;
  task_id?: number;
  task_title?: string;
  assigned_by?: string;
  priority?: string;
  due_date?: string;
  tasks?: Array<{ id: number; title: string }>;
}

/** El campo `type` del JSON es el nombre de clase PHP — usar `data.type` para lógica */
export interface Notification {
  id: string;
  type: string;
  data: NotificationData;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPaginatedResponse {
  data: Notification[];
  meta: {
    current_page: number;
    total: number;
    per_page: number;
    last_page?: number;
  };
}

export interface NotificationUnreadCountResponse {
  count: number;
}

export interface NotificationIcon {
  emoji: string;
  label: string;
  color: string;
  bgColor: string;
}

export const NOTIFICATION_CONFIG: Record<NotificationType, NotificationIcon> = {
  task_assigned: {
    emoji: '📋',
    label: 'Tarea asignada',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  task_delegated: {
    emoji: '🔁',
    label: 'Tarea delegada',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  task_submitted_for_review: {
    emoji: '📝',
    label: 'Enviada a revisión',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
  },
  task_approved: {
    emoji: '✅',
    label: 'Tarea aprobada',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  task_rejected: {
    emoji: '❌',
    label: 'Tarea rechazada',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
  task_completed: {
    emoji: '🏁',
    label: 'Tarea completada',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  task_cancelled: {
    emoji: '🚫',
    label: 'Tarea cancelada',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
  },
  task_reopened: {
    emoji: '🔄',
    label: 'Tarea reabierta',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  task_comment: {
    emoji: '💬',
    label: 'Nuevo comentario',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
  },
  task_due_soon: {
    emoji: '⏰',
    label: 'Próxima a vencer',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
  },
  task_overdue: {
    emoji: '🚨',
    label: 'Tarea vencida',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
  inactivity_alert: {
    emoji: '😴',
    label: 'Alerta de inactividad',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
  },
  daily_summary: {
    emoji: '📊',
    label: 'Resumen diario',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
  },
};
