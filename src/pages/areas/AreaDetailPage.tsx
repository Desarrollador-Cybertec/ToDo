import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { areasApi } from '../../api/areas';
import { dashboardApi } from '../../api/dashboard';
import { useAuth } from '../../context/useAuth';
import { Role, TASK_STATUS_LABELS } from '../../types/enums';
import { ApiError } from '../../api/client';
import type { Area, AreaDashboard } from '../../types';
import { HiOutlineArrowLeft } from 'react-icons/hi';

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
      setArea(areaRes.data);
      if (dashRes) setDashboard(dashRes.data);
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
      await areasApi.claimWorker({ user_id: Number(claimUserId), area_id: areaId });
      setClaimSuccess('Trabajador agregado al área');
      setClaimUserId('');
      loadData();
      setTimeout(() => setClaimSuccess(''), 3000);
    } catch (error) {
      setClaimError(error instanceof ApiError ? error.data.message : 'Error al reclamar trabajador');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  if (!area) return null;

  return (
    <div className="mx-auto max-w-4xl">
      <button type="button" onClick={() => navigate('/areas')} className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
        <HiOutlineArrowLeft className="h-4 w-4" /> Volver a áreas
      </button>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{area.name}</h2>
            {area.description && <p className="mt-2 text-gray-600">{area.description}</p>}
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${area.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {area.active ? 'Activa' : 'Inactiva'}
          </span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Encargado</p>
            <p className="text-sm text-gray-900">{area.manager?.name ?? 'Sin asignar'}</p>
          </div>
          {area.process_identifier && (
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">Proceso</p>
              <p className="text-sm text-gray-900">{area.process_identifier}</p>
            </div>
          )}
        </div>
      </div>

      {isManager && (
        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-semibold text-gray-900">Reclamar trabajador</h3>
          {claimError && <div className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-600">{claimError}</div>}
          {claimSuccess && <div className="mb-3 rounded-lg bg-green-50 p-2 text-sm text-green-600">{claimSuccess}</div>}
          <div className="flex gap-3">
            <input
              type="number"
              value={claimUserId}
              onChange={(e) => setClaimUserId(e.target.value)}
              placeholder="ID del trabajador"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button type="button" onClick={handleClaim} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
              Reclamar
            </button>
          </div>
        </div>
      )}

      {dashboard && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Tareas por estado</h3>
            <div className="space-y-2">
              {Object.entries(dashboard.tasks_by_status).map(([status, count]) => (
                <div key={status} className="flex justify-between text-sm">
                  <span className="text-gray-600">{TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS] ?? status}</span>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Métricas</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tasa de cumplimiento</span>
                <span className="font-medium text-gray-900">{dashboard.completion_rate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Vencidas</span>
                <span className="font-medium text-red-600">{dashboard.overdue_tasks}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sin avance</span>
                <span className="font-medium text-amber-600">{dashboard.tasks_without_progress}</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-6 shadow-sm lg:col-span-2">
            <h3 className="mb-4 font-semibold text-gray-900">Distribución por responsable</h3>
            <div className="space-y-2">
              {dashboard.tasks_by_responsible.map((r) => (
                <div key={r.user_id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{r.user_name}</span>
                  <span className="font-medium text-gray-900">{r.task_count} tareas</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
