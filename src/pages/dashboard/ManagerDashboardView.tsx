import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboard';
import { TASK_STATUS_LABELS } from '../../types/enums';
import type { PersonalDashboard } from '../../types';
import { HiOutlineClipboardList, HiOutlineClock, HiOutlineExclamation, HiOutlineCheckCircle, HiOutlineChevronRight } from 'react-icons/hi';
import { StaggerList, StaggerItem, SkeletonDashboard, Badge, STATUS_BADGE_VARIANT } from '../../components/ui';
import { StatCard } from '../../components/dashboard/StatCard';
import { DashboardCard } from '../../components/dashboard/DashboardCard';

export function ManagerDashboardView() {
  const [personalData, setPersonalData] = useState<PersonalDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.personal().then((res) => {
      setPersonalData(res);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonDashboard />;
  if (!personalData) return <p className="text-gray-500">No se pudo cargar el dashboard.</p>;

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tareas activas" value={personalData.active_tasks ?? 0} icon={<HiOutlineClipboardList className="h-6 w-6 text-blue-600" />} color="bg-blue-50" delay={0} />
        <StatCard label="Completadas" value={personalData.completed_tasks ?? 0} icon={<HiOutlineCheckCircle className="h-6 w-6 text-green-600" />} color="bg-green-50" delay={0.05} />
        <StatCard label="Vencidas" value={personalData.overdue_tasks ?? 0} icon={<HiOutlineExclamation className="h-6 w-6 text-red-600" />} color="bg-red-50" delay={0.1} />
        <StatCard label="Próximas a vencer" value={personalData.due_soon_tasks ?? 0} icon={<HiOutlineClock className="h-6 w-6 text-amber-600" />} color="bg-amber-50" delay={0.15} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Tareas por estado" delay={0.2}>
          <StaggerList className="space-y-3">
            {Object.entries(personalData.tasks_by_status ?? {}).map(([status, count]) => (
              <StaggerItem key={status}>
                <div className="flex items-center justify-between rounded-lg px-1 py-0.5">
                  <Badge variant={STATUS_BADGE_VARIANT[status]}>{TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS] ?? status}</Badge>
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </DashboardCard>

        <DashboardCard title="Próximas tareas" delay={0.25}>
          {(personalData.upcoming_tasks ?? []).length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">Sin tareas próximas</p>
          ) : (
            <StaggerList className="space-y-2">
              {(personalData.upcoming_tasks ?? []).map((t) => (
                <StaggerItem key={t.id}>
                  <Link to={`/tasks/${t.id}`} className="group flex items-center justify-between rounded-xl border border-gray-100 p-3.5 transition-all hover:border-blue-100 hover:bg-blue-50/50">
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700">{t.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={STATUS_BADGE_VARIANT[t.status]}>{TASK_STATUS_LABELS[t.status as keyof typeof TASK_STATUS_LABELS] ?? t.status}</Badge>
                        {t.due_date && <span className="text-xs text-gray-500">Vence: {new Date(t.due_date).toLocaleDateString('es-PE')}</span>}
                      </div>
                    </div>
                    <HiOutlineChevronRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-blue-500" />
                  </Link>
                </StaggerItem>
              ))}
            </StaggerList>
          )}
        </DashboardCard>
      </div>
    </>
  );
}
