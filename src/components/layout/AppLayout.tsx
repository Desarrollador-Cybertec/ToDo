import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { Role, ROLE_LABELS } from '../../types/enums';
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
    roles: [Role.SUPERADMIN, Role.AREA_MANAGER],
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

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role.slug)),
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white shadow-lg transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <h1 className="text-xl font-bold text-blue-600">TAPE</h1>
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <HiOutlineX className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {visibleItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t p-4">
          <div className="mb-3 px-3">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">
              {user?.role && ROLE_LABELS[user.role.slug]}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <HiOutlineLogout className="h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center border-b bg-white px-6 shadow-sm lg:px-8">
          <button
            type="button"
            className="mr-4 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <HiOutlineMenu className="h-6 w-6" />
          </button>
          <div className="flex-1" />
          <p className="text-sm text-gray-500">
            {user?.email}
          </p>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
