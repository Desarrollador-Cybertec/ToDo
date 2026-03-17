import { useEffect, useState, useCallback } from 'react';
import { areasApi } from '../../api/areas';
import { usersApi } from '../../api/users';
import { useAuth } from '../../context/useAuth';
import { ApiError } from '../../api/client';
import type { User, Area, AreaMember } from '../../types';
import { AnimatePresence } from 'framer-motion';
import {
  HiOutlineUserAdd,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineSearch,
  HiOutlineUsers,
  HiOutlineUserGroup,
} from 'react-icons/hi';
import { PageTransition, FadeIn, SlideDown, StaggerList, StaggerItem, EmptyState, SkeletonCard, Badge } from '../../components/ui';

export function ClaimWorkersPage() {
  const { user } = useAuth();
  const [myArea, setMyArea] = useState<Area | null>(null);
  const [members, setMembers] = useState<AreaMember[]>([]);
  const [availableWorkers, setAvailableWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [users, areas] = await Promise.all([
        usersApi.list(),
        areasApi.list(),
      ]);

      // For area_manager, the API scopes areas to theirs.
      // Try matching by manager_user_id first, fallback to first area.
      const areaList = areas ?? [];
      const managerArea =
        areaList.find((a) => a.manager_user_id === user?.id) ?? areaList[0] ?? null;
      setMyArea(managerArea);

      // Get area members from the area detail (includes members relation)
      let areaMembers: AreaMember[] = [];
      if (managerArea) {
        try {
          const areaDetail = await areasApi.get(managerArea.id);
          console.log('Area detail response:', JSON.stringify(areaDetail, null, 2));
          // members may come as array or wrapped in { data: [...] }
          const rawMembers = areaDetail.members;
          if (Array.isArray(rawMembers)) {
            areaMembers = rawMembers;
          } else if (rawMembers && typeof rawMembers === 'object' && 'data' in rawMembers) {
            areaMembers = (rawMembers as unknown as { data: AreaMember[] }).data ?? [];
          }
        } catch {
          areaMembers = [];
        }
      }
      setMembers(areaMembers);

      // IDs of users already in the area
      const memberUserIds = new Set(
        areaMembers.map((m) => m.user_id ?? m.user?.id).filter(Boolean),
      );

      // Filter: active workers NOT in the area
      const workerList = (users ?? []).filter(
        (u) => u.role?.slug === 'worker' && u.active && !memberUserIds.has(u.id),
      );
      setAvailableWorkers(workerList);
    } catch {
      setAvailableWorkers([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClaim = async (userId: number) => {
    if (!myArea) {
      setError('No se encontró tu área asignada');
      return;
    }
    setClaimingId(userId);
    setError('');
    setSuccess('');
    try {
      await areasApi.claimWorker({ area_id: myArea.id, user_id: userId });
      setSuccess('Trabajador reclamado exitosamente');
      setLoading(true);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data.message || 'Error al reclamar trabajador');
      } else {
        setError('Error de conexión');
      }
      setTimeout(() => setError(''), 5000);
    } finally {
      setClaimingId(null);
    }
  };

  const filteredAvailable = availableWorkers.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PageTransition>
      {/* Header with area info */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Mi equipo</h2>
        {myArea && (
          <div className="mt-2 flex items-center gap-2">
            <HiOutlineUserGroup className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-gray-600">
              Área: <span className="font-semibold text-gray-900">{myArea.name}</span>
            </span>
            <Badge variant={myArea.active ? 'green' : 'red'} size="sm">
              {myArea.active ? 'Activa' : 'Inactiva'}
            </Badge>
          </div>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <SlideDown>
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600 ring-1 ring-inset ring-red-200">
              <HiOutlineExclamationCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          </SlideDown>
        )}
        {success && (
          <SlideDown>
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-600 ring-1 ring-inset ring-green-200">
              <HiOutlineCheckCircle className="h-4 w-4 shrink-0" /> {success}
            </div>
          </SlideDown>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <>
          {/* Current team members */}
          <FadeIn className="mb-8">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <HiOutlineUsers className="h-5 w-5 text-indigo-500" />
              Trabajadores del área
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                {members.length}
              </span>
            </h3>
            {members.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
                <p className="text-sm text-gray-500">No hay trabajadores en tu área aún</p>
              </div>
            ) : (
              <StaggerList className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((member) => (
                  <StaggerItem key={member.id}>
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-500 text-sm font-medium text-white">
                          {member.user?.name?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">{member.user?.name ?? 'Desconocido'}</p>
                          <p className="truncate text-xs text-gray-500">{member.user?.email ?? ''}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                        <Badge variant="green" size="sm">En el equipo</Badge>
                        <span>desde {new Date(member.joined_at).toLocaleDateString('es-PE')}</span>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerList>
            )}
          </FadeIn>

          {/* Divider */}
          <div className="mb-8 border-t border-gray-200" />

          {/* Available workers to claim */}
          <FadeIn delay={0.1}>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <HiOutlineUserAdd className="h-5 w-5 text-blue-500" />
              Trabajadores disponibles
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                {availableWorkers.length}
              </span>
            </h3>

            {/* Search */}
            <div className="relative mb-4">
              <HiOutlineSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {filteredAvailable.length === 0 ? (
              <EmptyState
                icon={<HiOutlineUsers className="h-12 w-12" />}
                title={search ? 'Sin resultados' : 'No hay trabajadores disponibles'}
                description={
                  search
                    ? 'Intenta con otro término de búsqueda.'
                    : 'Todos los trabajadores activos ya pertenecen a un área.'
                }
              />
            ) : (
              <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAvailable.map((worker) => (
                  <StaggerItem key={worker.id}>
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-500 text-sm font-medium text-white">
                          {worker.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">{worker.name}</p>
                          <p className="truncate text-xs text-gray-500">{worker.email}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleClaim(worker.id)}
                        disabled={claimingId === worker.id}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {claimingId === worker.id ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <HiOutlineUserAdd className="h-4 w-4" />
                        )}
                        {claimingId === worker.id ? 'Reclamando...' : 'Reclamar'}
                      </button>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerList>
            )}
          </FadeIn>
        </>
      )}
    </PageTransition>
  );
}

