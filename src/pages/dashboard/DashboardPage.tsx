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
      {renderDashboard()}
    </PageTransition>
  );
}
