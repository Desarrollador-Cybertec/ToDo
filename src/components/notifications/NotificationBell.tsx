import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineBell } from 'react-icons/hi';
import { useNotifications } from '../../context/useNotifications';
import { NotificationPanel } from './NotificationPanel';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const bellRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useNotifications();

  // Calcular posición del panel relativa al botón de la campana
  useEffect(() => {
    if (isOpen && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      const panelWidth = 384; // w-96
      const spaceRight = window.innerWidth - rect.right;
      const left = spaceRight >= panelWidth
        ? rect.right - panelWidth
        : Math.max(8, rect.right - panelWidth);

      setPanelStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left,
        width: panelWidth,
      });
    }
  }, [isOpen]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        bellRef.current &&
        !bellRef.current.contains(event.target as Node) &&
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Recalcular posición al hacer scroll o resize
  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      if (bellRef.current) {
        const rect = bellRef.current.getBoundingClientRect();
        const panelWidth = 384;
        const spaceRight = window.innerWidth - rect.right;
        const left = spaceRight >= panelWidth
          ? rect.right - panelWidth
          : Math.max(8, rect.right - panelWidth);
        setPanelStyle({ position: 'fixed', top: rect.bottom + 8, left, width: panelWidth });
      }
    };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen]);

  const maxPanelHeight = typeof window !== 'undefined'
    ? window.innerHeight - (panelStyle.top as number ?? 0) - 16
    : 480;

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex items-center justify-center p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        title="Notificaciones"
      >
        <HiOutlineBell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && createPortal(
        <div
          ref={panelRef}
          style={{
            ...panelStyle,
            height: Math.min(maxPanelHeight, 520),
            maxHeight: Math.min(maxPanelHeight, 520),
            zIndex: 9999,
          }}
          className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
        >
          <NotificationPanel onClose={() => setIsOpen(false)} />
        </div>,
        document.body
      )}
    </div>
  );
}
