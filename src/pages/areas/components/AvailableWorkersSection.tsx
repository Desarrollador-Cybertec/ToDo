import { useEffect, useState, useCallback } from 'react';
import { areasApi } from '../../../api/areas';
import { ApiError } from '../../../api/client';
import type { User } from '../../../types';
import { StaggerList, StaggerItem, EmptyState, SkeletonCard } from '../../../components/ui';
import { FadeIn } from '../../../components/ui';
import {
  HiOutlineUserAdd,
  HiOutlineSearch,
  HiOutlineUsers,
} from 'react-icons/hi';

interface AvailableWorkersSectionProps {
  areaId: number;
  refreshKey: number;
  onClaimed: () => void;
}

export function AvailableWorkersSection({ areaId, refreshKey, onClaimed }: AvailableWorkersSectionProps) {
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [claimError, setClaimError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await areasApi.availableWorkers(areaId);
      setWorkers(Array.isArray(res) ? res : []);
    } catch {
      setError('Error al cargar trabajadores disponibles');
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  }, [areaId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const handleClaim = async (userId: number) => {
    setClaimingId(userId);
    setClaimError('');
    try {
      await areasApi.claimWorker({ area_id: areaId, user_id: userId });
      onClaimed();
    } catch (err) {
      if (err instanceof ApiError) {
        setClaimError(err.data.message || 'Error al reclamar trabajador');
      } else {
        setClaimError('Error de conexión');
      }
      setTimeout(() => setClaimError(''), 5000);
    } finally {
      setClaimingId(null);
    }
  };

  const filtered = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.email.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
        {error}
        <button type="button" onClick={load} className="ml-2 underline hover:text-red-800">Reintentar</button>
      </div>
    );
  }

  return (
    <FadeIn delay={0.1}>
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <HiOutlineUserAdd className="h-5 w-5 text-blue-500" />
        Trabajadores disponibles
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
          {workers.length}
        </span>
      </h3>

      {claimError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600 ring-1 ring-inset ring-red-200">
          {claimError}
        </div>
      )}

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

      {filtered.length === 0 ? (
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
          {filtered.map((worker) => (
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
  );
}
