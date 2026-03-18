import { useEffect, useState } from 'react';
import { dashboardApi } from '../../api/dashboard';
import { TASK_STATUS_LABELS } from '../../types/enums';
import type { GeneralDashboard, PendingByUser } from '../../types';
import { HiOutlineClipboardList, HiOutlineClock, HiOutlineExclamation, HiOutlineCheckCircle } from 'react-icons/hi';
import { StaggerList, StaggerItem, SkeletonDashboard, Badge, STATUS_BADGE_VARIANT } from '../../components/ui';
import { StatCard } from '../../components/dashboard/StatCard';
import { DashboardCard } from '../../components/dashboard/DashboardCard';

export function SuperAdminDashboard() {
  const [data, setData] = useState<GeneralDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    dashboardApi.general().then((res) => {
      setData(res);
    }).catch((err) => {
      console.error('Dashboard general error:', err);
      setError(true);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonDashboard />;
  if (error || !data) return <p className="text-gray-500">No se pudo cargar el dashboard general.</p>;

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tareas activas" value={data.total_active ?? 0} icon={<HiOutlineClipboardList className="h-6 w-6 text-blue-600" />} color="bg-blue-50" delay={0} />
        <StatCard label="Completadas" value={data.total_completed ?? 0} icon={<HiOutlineCheckCircle className="h-6 w-6 text-green-600" />} color="bg-green-50" delay={0.05} />
        <StatCard label="Vencidas" value={data.overdue_tasks ?? 0} icon={<HiOutlineExclamation className="h-6 w-6 text-red-600" />} color="bg-red-50" delay={0.1} />
        <StatCard label="Tasa de cumplimiento" value={`${data.completion_rate ?? 0}%`} icon={<HiOutlineClock className="h-6 w-6 text-amber-600" />} color="bg-amber-50" delay={0.15} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Tareas por estado" delay={0.2}>
          <StaggerList className="space-y-3">
            {Object.entries(data.tasks_by_status ?? {}).map(([status, count]) => (
              <StaggerItem key={status}>
                <div className="flex items-center justify-between rounded-lg px-1 py-0.5">
                  <Badge variant={STATUS_BADGE_VARIANT[status]}>{TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS] ?? status}</Badge>
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </DashboardCard>

        <DashboardCard title="Pendientes por usuario" delay={0.25}>
          <StaggerList className="space-y-3">
            {(data.pending_by_user ?? []).map((r: PendingByUser) => (
              <StaggerItem key={r.user_id}>
                <div className="flex items-center justify-between rounded-lg px-1 py-0.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-medium text-blue-600">
                      {r.user_name.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-700">{r.user_name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{r.pending_tasks}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </DashboardCard>

        <DashboardCard title="Tareas por área" delay={0.3}>
          <StaggerList className="space-y-3">
            {(data.tasks_by_area ?? []).map((a) => (
              <StaggerItem key={a.area_id}>
                <div className="flex items-center justify-between rounded-lg px-1 py-0.5">
                  <span className="text-sm text-gray-700">{a.area_name}</span>
                  <span className="text-sm font-medium text-gray-900">{a.total}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </DashboardCard>

        <DashboardCard title="Métricas" delay={0.35}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total de tareas</span>
              <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-sm font-semibold text-gray-700">{data.total_all ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Progreso global</span>
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-sm font-semibold text-blue-700">{data.global_progress ?? 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completadas este mes</span>
              <span className="rounded-lg bg-green-50 px-2.5 py-1 text-sm font-semibold text-green-700">{data.completed_this_month ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Próximas a vencer</span>
              <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-700">{data.due_soon ?? 0}</span>
            </div>
          </div>
        </DashboardCard>
      </div>
    </>
  );
}
