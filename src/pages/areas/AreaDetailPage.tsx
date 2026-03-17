import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { areasApi } from '../../api/areas';
import { dashboardApi } from '../../api/dashboard';
import { useAuth } from '../../context/useAuth';
import { Role, TASK_STATUS_LABELS } from '../../types/enums';
import { ApiError } from '../../api/client';
import type { Area, AreaDashboard } from '../../types';
import { HiOutlineArrowLeft, HiOutlineExclamationCircle, HiOutlineCheckCircle } from 'react-icons/hi';
import { AnimatePresence } from 'framer-motion';
import { PageTransition, FadeIn, SlideDown, Badge, STATUS_BADGE_VARIANT, SkeletonDetail } from '../../components/ui';

export function AreaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [area, setArea] = useState<Area | null>(null);
  const [dashboard, setDashboard] = useState<AreaDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimError, setClaimError] = useState('');
  const [claimSuccess, setClaimSuccess] = useState('');
  const [claimUserId, setClaimUserId] = useState('');

  const areaId = Number(id);
  const isManager = user?.role.slug === Role.AREA_MANAGER;

  const loadData = useCallback(async () => {
    try {
      const [areaRes, dashRes] = await Promise.all([
        areasApi.get(areaId),
        dashboardApi.area(areaId).catch(() => null),
      ]);
      setArea(areaRes);
      if (dashRes) setDashboard(dashRes);
    } catch {
      navigate('/areas');
    } finally {
      setLoading(false);
    }
  }, [areaId, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClaim = async () => {
    if (!claimUserId) return;
    setClaimError('');
    try {
      await areasApi.claimWorker({ user_id: Number(claimUserId) });
      setClaimSuccess('Trabajador agregado al área');
      setClaimUserId('');
      loadData();
      setTimeout(() => setClaimSuccess(''), 3000);
    } catch (error) {
      setClaimError(error instanceof ApiError ? error.data.message : 'Error al reclamar trabajador');
    }
  };

  if (loading) return <SkeletonDetail />;
  if (!area) return null;

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl">
        <button type="button" onClick={() => navigate('/areas')} className="mb-4 flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900">
          <HiOutlineArrowLeft className="h-4 w-4" /> Volver a áreas
        </button>

        <FadeIn className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{area.name}</h2>
              {area.description && <p className="mt-2 text-gray-600">{area.description}</p>}
            </div>
            <Badge variant={area.active ? 'green' : 'red'} size="md">{area.active ? 'Activa' : 'Inactiva'}</Badge>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Encargado</p>
              <div className="mt-1 flex items-center gap-2">
                {area.manager ? (
                  <>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs font-medium text-indigo-600">{area.manager.name.charAt(0)}</span>
                    <p className="text-sm text-gray-900">{area.manager.name}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Sin asignar</p>
                )}
              </div>
            </div>
            {area.process_identifier && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Proceso</p>
                <p className="mt-1 text-sm text-gray-900">{area.process_identifier}</p>
              </div>
            )}
          </div>
        </FadeIn>

        {isManager && (
          <FadeIn delay={0.05} className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-900">Reclamar trabajador</h3>
            <AnimatePresence>
              {claimError && (
                <SlideDown>
                  <div className="mb-3 flex items-center gap-2 rounded-xl bg-red-50 p-2 text-sm text-red-600 ring-1 ring-inset ring-red-200">
                    <HiOutlineExclamationCircle className="h-4 w-4 shrink-0" /> {claimError}
                  </div>
                </SlideDown>
              )}
              {claimSuccess && (
                <SlideDown>
                  <div className="mb-3 flex items-center gap-2 rounded-xl bg-green-50 p-2 text-sm text-green-600 ring-1 ring-inset ring-green-200">
                    <HiOutlineCheckCircle className="h-4 w-4 shrink-0" /> {claimSuccess}
                  </div>
                </SlideDown>
              )}
            </AnimatePresence>
            <div className="flex gap-3">
              <input
                type="number"
                value={claimUserId}
                onChange={(e) => setClaimUserId(e.target.value)}
                placeholder="ID del trabajador"
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button type="button" onClick={handleClaim} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98]">
                Reclamar
              </button>
            </div>
          </FadeIn>
        )}

        {dashboard && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <FadeIn delay={0.1} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Tareas por estado</h3>
              <div className="space-y-2.5">
                {Object.entries(dashboard.tasks_by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <Badge variant={STATUS_BADGE_VARIANT[status] ?? 'gray'} size="sm">{TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS] ?? status}</Badge>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={0.15} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Métricas</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tasa de cumplimiento</span>
                  <span className="rounded-lg bg-green-50 px-2 py-0.5 font-semibold text-green-700">{dashboard.completion_rate}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Vencidas</span>
                  <span className="rounded-lg bg-red-50 px-2 py-0.5 font-semibold text-red-600">{dashboard.overdue_tasks}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Sin avance</span>
                  <span className="rounded-lg bg-amber-50 px-2 py-0.5 font-semibold text-amber-600">{dashboard.tasks_without_progress}</span>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.2} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
              <h3 className="mb-4 font-semibold text-gray-900">Distribución por responsable</h3>
              <div className="space-y-2.5">
                {dashboard.tasks_by_responsible.map((r) => (
                  <div key={r.user_id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-medium text-blue-600">{r.user_name.charAt(0)}</span>
                      <span className="text-gray-700">{r.user_name}</span>
                    </div>
                    <span className="rounded-lg bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">{r.task_count}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
