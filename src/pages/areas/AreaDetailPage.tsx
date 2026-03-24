import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { Role } from '../../types/enums';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import { PageTransition } from '../../components/ui';
import { AreaInfoSection } from './components/AreaInfoSection';
import { AvailableWorkersSection } from './components/AvailableWorkersSection';
import { TeamMembersSection } from './components/TeamMembersSection';
import { AreaDashboardSection } from './components/AreaDashboardSection';
import { AreaTasksSection } from './components/AreaTasksSection';

export function AreaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const areaId = Number(id);
  const isManager = user?.role.slug === Role.AREA_MANAGER;
  const isSuperAdmin = user?.role.slug === Role.SUPERADMIN;
  const userRole = user?.role.slug ?? '';

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl">
        <button type="button" onClick={() => navigate('/areas')} className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-gray-100">
          <HiOutlineArrowLeft className="h-4 w-4" /> Volver a áreas
        </button>

        {/* Area info - endpoint: GET /areas/:id + GET /users */}
        <AreaInfoSection areaId={areaId} userRole={userRole} refreshKey={refreshKey} />

        {/* Available workers to claim - endpoint: GET /areas/:id/available-workers */}
        {isManager && (
          <AvailableWorkersSection areaId={areaId} refreshKey={refreshKey} onClaimed={handleRefresh} />
        )}

        {/* Dashboard metrics - endpoint: GET /dashboard/area/:id */}
        <AreaDashboardSection areaId={areaId} refreshKey={refreshKey} />

        {/* Tasks list - endpoint: GET /tasks?area_id=X + GET /areas/:id/members */}
        <AreaTasksSection areaId={areaId} isManager={isManager} refreshKey={refreshKey} />

        {/* Team members - endpoint: GET /areas/:id/members */}
        {(isManager || isSuperAdmin) && (
          <TeamMembersSection areaId={areaId} refreshKey={refreshKey} />
        )}
      </div>
    </PageTransition>
  );
}
