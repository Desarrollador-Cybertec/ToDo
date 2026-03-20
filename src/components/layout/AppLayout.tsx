import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/useAuth';
import { Role, ROLE_LABELS } from '../../types/enums';
import { areasApi } from '../../api/areas';
import {
  HiOutlineHome,
  HiOutlineClipboardList,
  HiOutlineUserGroup,
  HiOutlineCalendar,
  HiOutlineUsers,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineChartBar,
} from 'react-icons/hi';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <HiOutlineHome className="h-5 w-5" />,
  },
  {
    label: 'Tareas',
    path: '/tasks',
    icon: <HiOutlineClipboardList className="h-5 w-5" />,
  },
  {
    label: 'Áreas',
    path: '/areas',
    icon: <HiOutlineUserGroup className="h-5 w-5" />,
    roles: [Role.SUPERADMIN],
  },
  {
    label: 'Mi equipo',
    path: '/claim-workers',
    icon: <HiOutlineUserGroup className="h-5 w-5" />,
    roles: [Role.AREA_MANAGER],
  },
  {
    label: 'Reuniones',
    path: '/meetings',
    icon: <HiOutlineCalendar className="h-5 w-5" />,
    roles: [Role.SUPERADMIN, Role.AREA_MANAGER],
  },
  {
    label: 'Usuarios',
    path: '/users',
    icon: <HiOutlineUsers className="h-5 w-5" />,
    roles: [Role.SUPERADMIN],
  },
  {
    label: 'Consolidado',
    path: '/consolidated',
    icon: <HiOutlineChartBar className="h-5 w-5" />,
    roles: [Role.SUPERADMIN],
  },
  {
    label: 'Configuración',
    path: '/settings',
    icon: <HiOutlineCog className="h-5 w-5" />,
    roles: [Role.SUPERADMIN],
  },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [areaName, setAreaName] = useState<string | null>(null);

  useEffect(() => {
    const areaId = user?.area_id;
    if (!areaId) return;
    areasApi.get(areaId).then((area) => setAreaName(area.name)).catch(() => setAreaName(null));
  }, [user?.area_id]);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role.slug)),
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gray-200/80 bg-white transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-sm">
              T
            </div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900">TAPE</h1>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {visibleItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute inset-y-1 left-0 w-0.75 rounded-full bg-blue-600"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className={`transition-colors ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <NavLink
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `mb-3 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                isActive ? 'bg-blue-50 ring-1 ring-blue-100' : 'bg-gray-50 hover:bg-gray-100'
              }`
            }
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-500 text-sm font-medium text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="truncate text-xs text-gray-500">
                {user?.role && ROLE_LABELS[user.role.slug]}
              </p>
              {areaName && <p className="truncate text-xs text-gray-500">{areaName}</p>}
            </div>
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <HiOutlineLogout className="h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-10 flex h-12 items-center border-b border-gray-200/80 bg-white/80 px-6 backdrop-blur-md lg:hidden lg:px-8">
          <button
            type="button"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <HiOutlineMenu className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
