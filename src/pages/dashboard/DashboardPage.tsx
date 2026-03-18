import { useAuth } from '../../context/useAuth';
import { Role } from '../../types/enums';
import { PageTransition } from '../../components/ui';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { ManagerDashboardView } from './ManagerDashboardView';
import { PersonalDashboardView } from './PersonalDashboardView';

export function DashboardPage() {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role.slug) {
      case Role.SUPERADMIN:
        return <SuperAdminDashboard />;
      case Role.AREA_MANAGER:
        return <ManagerDashboardView />;
      default:
        return <PersonalDashboardView />;
    }
  };

  return (
    <PageTransition>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">
        ¡Bienvenido, {user?.name}!
      </h2>
      {renderDashboard()}
    </PageTransition>
  );
}
