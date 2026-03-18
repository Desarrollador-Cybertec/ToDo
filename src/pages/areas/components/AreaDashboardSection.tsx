import { useEffect, useState, useCallback } from 'react';
import { dashboardApi } from '../../../api/dashboard';
import { TASK_STATUS_LABELS } from '../../../types/enums';
import type { AreaDashboard } from '../../../types';
import { FadeIn, Badge, STATUS_BADGE_VARIANT, SkeletonCard } from '../../../components/ui';

interface AreaDashboardSectionProps {
  areaId: number;
  refreshKey: number;
}

export function AreaDashboardSection({ areaId, refreshKey }: AreaDashboardSectionProps) {
  const [dashboard, setDashboard] = useState<AreaDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await dashboardApi.area(areaId);
      setDashboard(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [areaId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (loading) {
    return (
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
        Error al cargar las métricas del área.
        <button type="button" onClick={load} className="ml-2 underline hover:text-red-800">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <FadeIn delay={0.1} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">Tareas por estado</h3>
        <div className="space-y-2.5">
          {Object.entries(dashboard.tasks_by_status ?? {}).map(([status, count]) => (
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
            <span className="rounded-lg bg-green-50 px-2 py-0.5 font-semibold text-green-700">{dashboard.completion_rate ?? 0}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Vencidas</span>
            <span className="rounded-lg bg-red-50 px-2 py-0.5 font-semibold text-red-600">{dashboard.overdue_tasks ?? 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Sin avance</span>
            <span className="rounded-lg bg-amber-50 px-2 py-0.5 font-semibold text-amber-600">{dashboard.tasks_without_progress ?? 0}</span>
          </div>
        </div>
      </FadeIn>
      <FadeIn delay={0.2} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
        <h3 className="mb-4 font-semibold text-gray-900">Empleados y carga de tareas</h3>
        {(dashboard.tasks_by_responsible ?? []).length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">No hay empleados con tareas asignadas.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/80">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Empleado</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Tareas activas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(dashboard.tasks_by_responsible ?? []).map((r) => (
                  <tr key={r.user_id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
                          {r.user_name.charAt(0)}
                        </span>
                        <span className="font-medium text-gray-800">{r.user_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center rounded-lg bg-blue-50 px-2.5 py-0.5 text-sm font-semibold text-blue-700">
                        {r.active_tasks}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FadeIn>
    </div>
  );
}
