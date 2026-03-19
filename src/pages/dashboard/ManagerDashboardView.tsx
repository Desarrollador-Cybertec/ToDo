import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboard';
import { areasApi } from '../../api/areas';
import { useAuth } from '../../context/useAuth';
import { TaskStatus, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../types/enums';
import type { PersonalDashboard, AreaDashboard, UpcomingTask, ResponsibleLoad } from '../../types';
import {
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineChevronRight,
  HiOutlineEye,
  HiOutlineLightningBolt,
  HiOutlineLightBulb,
  HiOutlinePlusCircle,
  HiOutlineUserGroup,
} from 'react-icons/hi';
import { FadeIn, SkeletonDashboard, Badge, STATUS_BADGE_VARIANT, PRIORITY_BADGE_VARIANT } from '../../components/ui';

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `Hace ${Math.abs(diffDays)} día${Math.abs(diffDays) !== 1 ? 's' : ''}`;
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Mañana';
  const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  if (diffDays <= 6) return weekdays[date.getDay()];
  return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}

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

        const [dashboard, areaDashboard] = await Promise.all([
          dashboardApi.personal(),
          areaId ? dashboardApi.area(areaId).catch(() => null) : Promise.resolve(null),
        ]);
        setData(dashboard);
        setAreaData(areaDashboard);
      } catch {
        // silently fail — UI handles nulls
      } finally {
        setLoading(false);
      }
    };
    resolveAndFetch();
  }, [user?.id, user?.area_id]);

  const urgentTasks = useMemo(() => {
    if (!data?.upcoming_tasks) return [];
    return data.upcoming_tasks.filter(
      (t) => t.is_overdue || t.status === TaskStatus.OVERDUE || t.priority === 'urgent' || t.priority === 'high'
    );
  }, [data]);

  const allTasks = useMemo(() => {
    if (!data?.upcoming_tasks) return [];
    return [...data.upcoming_tasks].sort((a, b) => {
      const prioOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      const pa = prioOrder[a.priority] ?? 9;
      const pb = prioOrder[b.priority] ?? 9;
      if (pa !== pb) return pa - pb;
      if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });
  }, [data]);

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
            {' '}y tienes <span className="font-semibold text-gray-900">{data.active_tasks ?? 0} propias activas</span>
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

/* ── Sub-components ── */

function ResponsibleRow({ responsible, max }: { responsible: ResponsibleLoad; max: number }) {
  const ratio = max > 0 ? responsible.active_tasks / max : 0;
  const pct = Math.round(ratio * 100);
  const barColor = responsible.active_tasks === 0
    ? 'bg-gray-200'
    : ratio > 0.75
    ? 'bg-red-500'
    : ratio > 0.4
    ? 'bg-amber-500'
    : 'bg-blue-400';
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
        {responsible.user_name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-medium text-gray-900">{responsible.user_name}</p>
          <span className="ml-2 shrink-0 text-sm font-semibold text-gray-900">{responsible.active_tasks}</span>
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
          <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon, color, alert }: { label: string; value: number; icon: React.ReactNode; color: string; alert?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-3 transition-colors ${alert ? 'border-red-200 bg-red-50/40' : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'}`}>
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${color}`}>{icon}</span>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={`mt-1.5 text-xl font-bold ${alert ? 'text-red-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

function UrgentTaskRow({ task }: { task: UpcomingTask }) {
  const isOverdue = task.is_overdue ?? task.status === TaskStatus.OVERDUE;
  return (
    <div className="flex items-center justify-between gap-3 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{task.title}</p>
        <p className="mt-0.5 text-xs text-gray-500">
          {isOverdue ? (
            <span className="font-medium text-red-600">Vencida · {formatRelativeDate(task.due_date)}</span>
          ) : (
            <>Vence {task.due_date ? formatRelativeDate(task.due_date) : 'sin fecha'}</>
          )}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant={PRIORITY_BADGE_VARIANT[task.priority]} size="sm">{TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS]}</Badge>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link to={`/tasks/${task.id}`} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50">
          <HiOutlineEye className="inline h-3.5 w-3.5" /> Ver
        </Link>
        <Link to={`/tasks/${task.id}`} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700">
          <HiOutlineLightningBolt className="inline h-3.5 w-3.5" /> Gestionar
        </Link>
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: UpcomingTask }) {
  return (
    <div className="flex items-center justify-between gap-3 px-6 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{task.title}</p>
        <p className="mt-0.5 text-xs text-gray-500">
          {task.due_date ? formatRelativeDate(task.due_date) : 'Sin fecha límite'}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant={PRIORITY_BADGE_VARIANT[task.priority]} size="sm">{TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS]}</Badge>
          {task.status === TaskStatus.OVERDUE && <Badge variant="red" size="sm">Vencida</Badge>}
          {task.status === TaskStatus.IN_REVIEW && <Badge variant="purple" size="sm">En revisión</Badge>}
        </div>
      </div>
      <Link
        to={`/tasks/${task.id}`}
        className="flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
      >
        Revisar <HiOutlineChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
