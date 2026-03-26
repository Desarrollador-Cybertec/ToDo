import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/useNotifications';
import type { Notification, NotificationType } from '../../types/notification';
import { NOTIFICATION_CONFIG } from '../../types/notification';
import { HiOutlineCheck, HiOutlineChevronRight } from 'react-icons/hi';

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

export function NotificationsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filtered = filterByTab(notifications, activeTab);
  const unreadFiltered = filtered.filter((n) => !n.read_at);

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
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Notificaciones
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {notifications.length === 0
            ? 'No tienes notificaciones'
            : `${notifications.length} notificación${notifications.length !== 1 ? 'es' : ''}`}
        </p>
      </div>

      {/* Acciones + Pestañas */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Marcar todas como leídas */}
        {unreadFiltered.length > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          >
            <HiOutlineCheck className="h-4 w-4" />
            Marcar todas como leídas ({unreadFiltered.length})
          </button>
        )}
      </div>

      {/* Lista de notificaciones */}
      <div className="space-y-3">
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Cargando notificaciones...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-gray-500 dark:text-gray-400">
              No hay notificaciones en esta categoría
            </p>
          </div>
        ) : (
          <>
            {filtered.map((notification) => {
              const iconConfig = getIconConfig(notification.data.type);
              const isUnread = !notification.read_at;

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                    isUnread
                      ? `border-blue-200 dark:border-blue-800 ${iconConfig.bgColor}`
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-75'
                  }`}
                >
                  <div className="flex gap-4 items-start">
                    <div className="text-3xl shrink-0">{iconConfig.emoji}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className={`text-sm text-gray-900 dark:text-gray-100 ${isUnread ? 'font-bold' : 'font-semibold'}`}>
                            {iconConfig.label}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.data.message}
                          </p>
                        </div>
                        {isUnread && (
                          <div className="shrink-0 w-3 h-3 bg-blue-500 rounded-full mt-1.5" />
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 border-opacity-40">
                        <div className="flex flex-col gap-1">
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {new Date(notification.created_at).toLocaleString('es-ES')}
                          </p>
                          {notification.data.task_title && (
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                              Tarea: {notification.data.task_title}
                            </p>
                          )}
                        </div>
                        <HiOutlineChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-600 shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
