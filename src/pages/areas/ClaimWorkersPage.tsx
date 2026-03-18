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
      const areas = await areasApi.list();
      const areaList = areas ?? [];
      const managerArea =
        areaList.find((a) => a.manager_user_id === user?.id) ?? areaList[0] ?? null;
      setMyArea(managerArea);
    } catch {
      setMyArea(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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
        <p className="text-gray-500">No se encontró tu área asignada.</p>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      {/* Header with area info */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Mi equipo</h2>
        <div className="mt-2 flex items-center gap-2">
          <HiOutlineUserGroup className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-gray-600">
            Área: <span className="font-semibold text-gray-900">{myArea.name}</span>
          </span>
          <Badge variant={myArea.active ? 'green' : 'red'} size="sm">
            {myArea.active ? 'Activa' : 'Inactiva'}
          </Badge>
        </div>
      </div>

      {/* Team members - endpoint: GET /areas/:id (members) */}
      <TeamMembersSection areaId={myArea.id} refreshKey={refreshKey} />

      {/* Divider */}
      <div className="mb-8 border-t border-gray-200" />

      {/* Available workers - endpoint: GET /areas/:id/available-workers */}
      <AvailableWorkersSection areaId={myArea.id} refreshKey={refreshKey} onClaimed={handleClaimed} />
    </PageTransition>
  );
}

