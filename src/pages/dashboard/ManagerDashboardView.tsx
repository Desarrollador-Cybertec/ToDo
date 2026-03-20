import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboard';
import { areasApi } from '../../api/areas';
import { tasksApi } from '../../api/tasks';
import { useAuth } from '../../context/useAuth';
import { TaskStatus, TASK_STATUS_LABELS } from '../../types/enums';
import type { PersonalDashboard, AreaDashboard, UpcomingTask } from '../../types';
import {
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineLightBulb,
  HiOutlinePlusCircle,
  HiOutlineUserGroup,
} from 'react-icons/hi';
import { FadeIn, SkeletonDashboard, Badge, STATUS_BADGE_VARIANT } from '../../components/ui';
import { PRIORITY_ORDER } from '../../utils';
import { ResponsibleRow, MiniStat, UrgentTaskRow, TaskRow } from './components/DashboardWidgets';

const TIPS = [
  { icon: '✅', text: 'Revisa las tareas pendientes de aprobación para no frenar a tu equipo.' },
  { icon: '📋', text: 'Usa "Reclamar trabajadores" para gestionar tu equipo.' },
  { icon: '⏰', text: 'Las tareas vencidas del equipo aparecen resaltadas en rojo.' },
  { icon: '📊', text: 'Monitorea el estado de cada tarea para anticipar retrasos.' },
];

export function ManagerDashboardView() {
  const { user } = useAuth();
  const [data, setData] = useState<PersonalDashboard | null>(null);
  const [areaData, setAreaData] = useState<AreaDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolveAndFetch = async () => {
      try {
        // Get area ID from /me first; fall back to scanning the areas list
        let areaId: number | null = user?.area_id ? Number(user.area_id) : null;
        if (!areaId && user?.id) {
          const areas = await areasApi.listAll().catch(() => []);
          const uid = Number(user.id);
          areaId =
            areas.find(
              (a) =>
                Number(a.manager_user_id) === uid ||
                (a.manager?.id != null && Number(a.manager.id) === uid),
            )?.id ?? null;
        }

        const [dashboard, areaDashboard, tasksPage] = await Promise.all([
          dashboardApi.personal(),
          areaId ? dashboardApi.area(areaId).catch(() => null) : Promise.resolve(null),
          tasksApi.list('per_page=100'),
        ]);

        // Backend excludes personal tasks (no area) from /dashboard/me — merge them in
        const terminal = ['completed', 'cancelled'];
        const personalTasks = (tasksPage.data ?? []).filter((t) => !t.area_id && !t.area?.id);

        if (personalTasks.length > 0) {
          const personalUpcoming: UpcomingTask[] = personalTasks.map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            due_date: t.due_date ?? null,
            is_overdue: t.is_overdue,
          }));

          const addActive = personalTasks.filter((t) => !terminal.includes(t.status)).length;
          const addOverdue = personalTasks.filter(
            (t) => t.is_overdue || t.status === TaskStatus.OVERDUE,
          ).length;

          setData({
            ...dashboard,
            active_tasks: (dashboard.active_tasks ?? 0) + addActive,
            overdue_tasks: (dashboard.overdue_tasks ?? 0) + addOverdue,
            upcoming_tasks: [...(dashboard.upcoming_tasks ?? []), ...personalUpcoming],
          });
        } else {
          setData(dashboard);
        }

        setAreaData(areaDashboard);
      } catch {
        // silently fail — UI handles nulls
      } finally {
        setLoading(false);
      }
    };
    resolveAndFetch();
  }, [user?.id, user?.area_id]);

  const personalTasks = useMemo(() => {
    return (data?.upcoming_tasks ?? []).filter(
      (t) => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED,
    );
  }, [data?.upcoming_tasks]);

  // Urgentes: tareas iniciadas (en progreso, vencidas, rechazadas) o con prioridad alta/urgente
  const urgentTasks = useMemo(() => {
    return personalTasks.filter(
      (t) =>
        t.status === TaskStatus.IN_PROGRESS ||
        t.status === TaskStatus.OVERDUE ||
        t.status === TaskStatus.REJECTED ||
        t.is_overdue ||
        t.priority === 'urgent' ||
        t.priority === 'high'
    );
  }, [personalTasks]);

  // Próximas: tareas no iniciadas (pending, pending_assignment, in_review)
  const allTasks = useMemo(() => {
    return personalTasks
      .filter(
        (t) =>
          t.status !== TaskStatus.IN_PROGRESS &&
          t.status !== TaskStatus.OVERDUE &&
          t.status !== TaskStatus.REJECTED &&
          !t.is_overdue
      )
      .sort((a, b) => {
        const pa = PRIORITY_ORDER[a.priority] ?? 9;
        const pb = PRIORITY_ORDER[b.priority] ?? 9;
        if (pa !== pb) return pa - pb;
        if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return 0;
      });
  }, [personalTasks]);

  if (loading) return <SkeletonDashboard />;
  if (!data) return <p className="text-gray-500">No se pudo cargar el dashboard.</p>;

  const firstName = user?.name?.split(' ')[0] ?? '';
  const attentionCount = urgentTasks.length;

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <FadeIn className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Hola, {firstName} <span className="inline-block origin-[70%_70%] animate-[wave_1.8s_ease-in-out_infinite]">👋</span>
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Tu área tiene <span className="font-semibold text-gray-900">{areaData?.total_tasks ?? 0} tareas</span>
            {' '}y tienes <span className="font-semibold text-gray-900">{personalTasks.length} tareas propias activas</span>
            {attentionCount > 0 && (
              <>. <span className="font-semibold text-red-600">{attentionCount} requieren tu atención</span></>
            )}.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/tasks/create"
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-blue-500/25 transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]"
          >
            <HiOutlinePlusCircle className="h-4 w-4" />
            Nueva tarea
          </Link>
          <Link
            to="/claim-workers"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <HiOutlineUserGroup className="h-4 w-4" />
            Mi equipo
          </Link>
        </div>
      </FadeIn>

      {/* ── Main two-column layout: 2/3 area | 1/3 personal ── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* ─── Columna área (2/3) ─── */}
        <div className="flex flex-col gap-6 lg:col-span-2 lg:order-1">
          {/* Section header */}
          <div className="flex items-center gap-2">
            <span className="text-base">🏢</span>
            <h3 className="text-sm font-semibold text-gray-800">Panel del área</h3>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* Area stats + completion rate — single card */}
          <FadeIn delay={0.2} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-gray-700">Resumen del área</h3>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Total" value={areaData?.total_tasks ?? 0} icon={<HiOutlineClipboardList className="h-4.5 w-4.5" />} color="text-blue-600 bg-blue-50" />
              <MiniStat label="Vencidas" value={areaData?.overdue_tasks ?? 0} icon={<HiOutlineExclamation className="h-4.5 w-4.5" />} color="text-red-600 bg-red-50" alert={(areaData?.overdue_tasks ?? 0) > 0} />
              <MiniStat label="Sin progreso" value={areaData?.without_progress ?? 0} icon={<HiOutlineClock className="h-4.5 w-4.5" />} color="text-amber-600 bg-amber-50" alert={(areaData?.without_progress ?? 0) > 0} />
              <MiniStat label="Completadas" value={areaData?.completed_tasks ?? 0} icon={<HiOutlineCheckCircle className="h-4.5 w-4.5" />} color="text-green-600 bg-green-50" />
            </div>
            {areaData?.completion_rate != null && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Tasa de cumplimiento</span>
                  <span className={`font-bold ${
                    areaData.completion_rate >= 75 ? 'text-green-600' : areaData.completion_rate >= 50 ? 'text-amber-600' : 'text-red-600'
                  }`}>{areaData.completion_rate}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      areaData.completion_rate >= 75 ? 'bg-green-500' : areaData.completion_rate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(areaData.completion_rate, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </FadeIn>

          {/* Team load + by-status side by side */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Carga del equipo */}
            <FadeIn delay={0.25} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                <HiOutlineUserGroup className="h-4.5 w-4.5 text-indigo-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">Carga del equipo</h3>
                  <p className="text-xs text-gray-500">Tareas activas por responsable.</p>
                </div>
              </div>
              <div className="divide-y divide-gray-50 px-5">
                {!areaData?.by_responsible?.length ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <HiOutlineUserGroup className="mb-2 h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-500">Sin datos de carga</p>
                  </div>
                ) : (
                  areaData.by_responsible.map((r, i) => (
                    <ResponsibleRow
                      key={r.user_id ?? `unassigned-${i}`}
                      responsible={r}
                      max={Math.max(...areaData.by_responsible.map((x) => x.active_tasks), 1)}
                    />
                  ))
                )}
              </div>
            </FadeIn>

            {/* Por estado del área */}
            <FadeIn delay={0.3} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <h3 className="font-semibold text-gray-900">Por estado (área)</h3>
              </div>
              <div className="divide-y divide-gray-50 px-5">
                {(() => {
                  const byStatus = areaData?.tasks_by_status ?? {};
                  const entries = Object.entries(byStatus).filter(([, c]) => c > 0);
                  if (entries.length === 0) {
                    return <p className="py-6 text-center text-sm text-gray-400">Sin datos de estado</p>;
                  }
                  const total = entries.reduce((s, [, c]) => s + c, 0) || 1;
                  return entries.map(([status, count]) => {
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={status} className="flex items-center gap-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <Badge variant={STATUS_BADGE_VARIANT[status] ?? 'gray'}>{TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS] ?? status}</Badge>
                            <span className="text-sm font-semibold text-gray-900">{count}</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                            <div
                              className={`h-1.5 rounded-full transition-all ${status === 'completed' ? 'bg-green-500' : status === 'overdue' ? 'bg-red-500' : 'bg-blue-400'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </FadeIn>
          </div>
        </div>

        {/* ─── Columna personal (1/3) ─── */}
        <div className="flex flex-col gap-6 lg:order-2">
          {/* Section header */}
          <div className="flex items-center gap-2">
            <span className="text-base">👤</span>
            <h3 className="text-sm font-semibold text-gray-800">Mi panel personal</h3>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* Urgent tasks */}
          <FadeIn delay={0.1} className="flex-1 rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <span className="text-lg">🔥</span>
              <div>
                <h3 className="font-semibold text-gray-900">Urgentes</h3>
                <p className="text-xs text-gray-500">Vencidas o alta prioridad.</p>
              </div>
            </div>
            <div className="divide-y divide-gray-50 px-5">
              {urgentTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <HiOutlineCheckCircle className="mb-2 h-8 w-8 text-green-400" />
                  <p className="text-sm font-medium text-gray-600">¡Todo bajo control!</p>
                </div>
              ) : (
                urgentTasks.slice(0, 4).map((t) => (
                  <UrgentTaskRow key={t.id} task={t} />
                ))
              )}
            </div>
          </FadeIn>

          {/* Upcoming personal tasks */}
          <FadeIn delay={0.15} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="font-semibold text-gray-900">Mis próximas tareas</h3>
              <Link to="/tasks" className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50">
                Ver todas
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {allTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-5 py-8 text-center">
                  <HiOutlineClipboardList className="mb-2 h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-500">Sin tareas asignadas</p>
                </div>
              ) : (
                allTasks.slice(0, 5).map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))
              )}
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Tips */}
      <FadeIn delay={0.35} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
          <HiOutlineLightBulb className="h-4.5 w-4.5 text-amber-500" />
          Consejos
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {TIPS.map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-xl bg-gray-50 px-3.5 py-2.5">
              <span className="mt-0.5 shrink-0 text-sm">{tip.icon}</span>
              <p className="text-xs leading-relaxed text-gray-600">{tip.text}</p>
            </div>
          ))}
        </div>
      </FadeIn>
    </div>
  );
}
