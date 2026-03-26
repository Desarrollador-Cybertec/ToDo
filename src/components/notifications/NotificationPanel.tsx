import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/useNotifications';
import type { Notification, NotificationType } from '../../types/notification';
import { NOTIFICATION_CONFIG } from '../../types/notification';
import { HiOutlineCheck } from 'react-icons/hi';

interface NotificationPanelProps {
  onClose: () => void;
}

type TabKey = 'all' | 'organizational' | 'personal';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'organizational', label: 'Organización' },
  { key: 'personal', label: 'Personal' },
];

function filterByTab(notifications: Notification[], tab: TabKey): Notification[] {
  if (tab === 'all') return notifications;
  if (tab === 'organizational')
    return notifications.filter(
      (n) => n.data.category === 'organizational' || n.data.category === 'summary'
    );
  return notifications.filter((n) => n.data.category === 'personal');
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  } = useNotifications();

  // Cargar notificaciones frescas cada vez que el panel se abre
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filtered = filterByTab(notifications, activeTab);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.read_at) {
        await markAsRead(notification.id);
      }

      const slug = notification.data.type;
      if (slug === 'inactivity_alert' || slug === 'daily_summary') {
        navigate('/tasks');
      } else if (notification.data.task_id) {
        navigate(`/tasks/${notification.data.task_id}`);
      }

      onClose();
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const getIconConfig = (type: NotificationType) =>
    NOTIFICATION_CONFIG[type] ?? {
      emoji: '🔔',
      label: 'Notificación',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    };

  return (
    <div className="flex flex-col h-full">
      {/* Encabezado */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Notificaciones
        </h3>
        {notifications.some((n) => !n.read_at) && (
          <button
            onClick={() => markAllAsRead()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            title="Marcar todas como leídas"
          >
            <HiOutlineCheck className="h-4 w-4" />
            Marcar todas
          </button>
        )}
      </div>

      {/* Pestañas de categoría */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 px-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-xs font-medium text-center transition-colors ${
              activeTab === tab.key
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista de notificaciones */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <p className="text-sm">Cargando...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No hay notificaciones</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.map((notification) => {
              const iconConfig = getIconConfig(notification.data.type);
              const isUnread = !notification.read_at;

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isUnread
                      ? iconConfig.bgColor
                      : 'bg-gray-50 dark:bg-gray-800/50 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="text-2xl shrink-0 pt-1">
                      {iconConfig.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`text-sm text-gray-900 dark:text-gray-100 ${
                            isUnread ? 'font-bold' : 'font-semibold'
                          }`}
                        >
                          {iconConfig.label}
                        </h4>
                        {isUnread && (
                          <div className="shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {notification.data.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        {new Date(notification.created_at).toLocaleString('es-ES')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pie de página */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <button
          onClick={() => {
            navigate('/notifications');
            onClose();
          }}
          className="w-full py-2 px-3 text-sm font-medium text-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md transition-colors"
        >
          Ver todas las notificaciones
        </button>
      </div>
    </div>
  );
}
