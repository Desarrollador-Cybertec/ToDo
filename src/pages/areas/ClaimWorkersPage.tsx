import { useEffect, useState, useCallback } from 'react';
import { areasApi } from '../../api/areas';
import { useAuth } from '../../context/useAuth';
import type { Area } from '../../types';
import { HiOutlineUserGroup } from 'react-icons/hi';
import { PageTransition, SkeletonCard, Badge } from '../../components/ui';
import { TeamMembersSection } from './components/TeamMembersSection';
import { AvailableWorkersSection } from './components/AvailableWorkersSection';

export function ClaimWorkersPage() {
  const { user } = useAuth();
  const [myArea, setMyArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadArea = useCallback(async () => {
    try {
      const areas = await areasApi.listAll();
      const areaList = areas ?? [];
      const uid = Number(user?.id);

      // 1. Match by area_id from /me (most reliable)
      // 2. Match by manager_user_id or manager.id (Number coercion to handle string IDs)
      const managerArea =
        (user?.area_id ? areaList.find((a) => Number(a.id) === Number(user.area_id)) : null) ??
        areaList.find(
          (a) =>
            Number(a.manager_user_id) === uid || Number(a.manager?.id) === uid ||
            (a.manager?.id != null && Number(a.manager.id) === uid),
        ) ??
        null;
      setMyArea(managerArea);
    } catch {
      setMyArea(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.area_id]);

  useEffect(() => {
    loadArea();
  }, [loadArea]);

  const handleClaimed = () => {
    setRefreshKey((k) => k + 1);
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      </PageTransition>
    );
  }

  if (!myArea) {
    return (
      <PageTransition>
        <p className="text-gray-500 dark:text-gray-400">No se encontró tu área asignada.</p>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      {/* Header with area info */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mi equipo</h2>
        <div className="mt-2 flex items-center gap-2">
          <HiOutlineUserGroup className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Área: <span className="font-semibold text-gray-900 dark:text-gray-100">{myArea.name}</span>
          </span>
          <Badge variant={myArea.active ? 'green' : 'red'} size="sm">
            {myArea.active ? 'Activa' : 'Inactiva'}
          </Badge>
        </div>
      </div>

      {/* Team members - endpoint: GET /areas/:id (members) */}
      <TeamMembersSection areaId={myArea.id} refreshKey={refreshKey} />

      {/* Divider */}
      <div className="mb-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-t border-gray-200 dark:border-gray-700" />

      {/* Available workers - endpoint: GET /areas/:id/available-workers */}
      <AvailableWorkersSection areaId={myArea.id} refreshKey={refreshKey} onClaimed={handleClaimed} />
    </PageTransition>
  );
}

