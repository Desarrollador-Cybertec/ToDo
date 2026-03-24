import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboard';
import { tasksApi } from '../../api/tasks';
import { useAuth } from '../../context/useAuth';
import { TaskStatus, TASK_PRIORITY_LABELS } from '../../types/enums';
import type { PersonalDashboard, UpcomingTask } from '../../types';
import {
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineChevronRight,
  HiOutlineEye,
  HiOutlineLightningBolt,
  HiOutlineCalendar,
  HiOutlineQuestionMarkCircle,
  HiOutlinePlus,
} from 'react-icons/hi';
import { FadeIn, SkeletonDashboard, Badge, PRIORITY_BADGE_VARIANT } from '../../components/ui';

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
  { icon: '💡', text: 'Una tarea con "Adjunto obligatorio" no se puede cerrar sin evidencia.' },
  { icon: '🔄', text: 'Usa "Actualizar" para dejar comentario y porcentaje de avance.' },
  { icon: '✅', text: 'Marca como resuelta solo cuando ya esté lista para revisión o cierre.' },
  { icon: '📎', text: 'Puedes adjuntar archivos de evidencia en cualquier momento.' },
  { icon: '⏰', text: 'Las tareas vencidas aparecen resaltadas en rojo para priorizar.' },
];

export function PersonalDashboardView() {
  const { user } = useAuth();
  const [data, setData] = useState<PersonalDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [personalTaskIds, setPersonalTaskIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const terminal = ['completed', 'cancelled'];
    const threeDaysFromNow = Date.now() + 3 * 24 * 60 * 60 * 1000;

    Promise.all([
      dashboardApi.personal(),
      tasksApi.list('per_page=100'),
    ])
      .then(([dashboard, tasksPage]) => {
        // Filter personal tasks (no area) — backend excludes these from /dashboard/me
        // Use both area_id scalar and area relation, since list endpoint may omit the scalar
        const personalTasks = (tasksPage.data ?? []).filter((t) => !t.area_id && !t.area?.id);

        // Always track personal task IDs so urgentTasks can exclude them
        setPersonalTaskIds(new Set(personalTasks.map((t) => t.id)));

        if (personalTasks.length === 0) {
          setData(dashboard);
          return;
        }

        // Convert Task → UpcomingTask shape
        const personalUpcoming: UpcomingTask[] = personalTasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          due_date: t.due_date ?? null,
          is_overdue: t.is_overdue,
        }));

        // Merge and adjust stats
        const mergedUpcoming = [...(dashboard.upcoming_tasks ?? []), ...personalUpcoming];

        const addActive = personalTasks.filter((t) => !terminal.includes(t.status)).length;
        const addOverdue = personalTasks.filter((t) => t.is_overdue || t.status === TaskStatus.OVERDUE).length;
        const addCompleted = personalTasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
        const addDueSoon = personalTasks.filter((t) => {
          if (!t.due_date || terminal.includes(t.status)) return false;
          const due = new Date(t.due_date).getTime();
          return due > Date.now() && due <= threeDaysFromNow;
        }).length;

        // Merge tasks_by_status counts
        const mergedByStatus = { ...dashboard.tasks_by_status };
        personalTasks.forEach((t) => {
          mergedByStatus[t.status] = (mergedByStatus[t.status] ?? 0) + 1;
        });

        setData({
          ...dashboard,
          active_tasks: (dashboard.active_tasks ?? 0) + addActive,
          overdue_tasks: (dashboard.overdue_tasks ?? 0) + addOverdue,
          completed_tasks: (dashboard.completed_tasks ?? 0) + addCompleted,
          due_soon_tasks: (dashboard.due_soon_tasks ?? 0) + addDueSoon,
          tasks_by_status: mergedByStatus,
          upcoming_tasks: mergedUpcoming,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // "Lo importante hoy" = tasks assigned by manager/superadmin (i.e. area tasks, not personal)
  const urgentTasks = useMemo(() => {
    if (!data?.upcoming_tasks) return [];
    return data.upcoming_tasks.filter(
      (t) => !personalTaskIds.has(t.id)
    );
  }, [data, personalTaskIds]);

  const myTasks = useMemo(() => {
    if (!data?.upcoming_tasks) return [];
    const active = ['in_progress', 'in_review', 'rejected', 'overdue'];
    return [...data.upcoming_tasks]
      .filter((t) => active.includes(t.status))
      .sort((a, b) => {
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

  const pendingTasks = useMemo(() => {
    if (!data?.upcoming_tasks) return [];
    const notStarted = ['pending', 'pending_assignment'];
    return [...data.upcoming_tasks]
      .filter((t) => notStarted.includes(t.status))
      .sort((a, b) => {
        if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return 0;
      });
  }, [data]);

  const inReviewCount = useMemo(() => data?.tasks_by_status?.[TaskStatus.IN_REVIEW] ?? 0, [data]);

  if (loading) return <SkeletonDashboard />;
  if (!data) return <p className="text-gray-500 dark:text-gray-400">No se pudo cargar el dashboard.</p>;

  const attentionCount = urgentTasks.length;
  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <FadeIn className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-5 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Hola, {firstName} <span className="inline-block animate-[wave_1.8s_ease-in-out_infinite] origin-[70%_70%]">👋</span>
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tienes <span className="font-semibold text-gray-900 dark:text-gray-100">{data.active_tasks ?? 0} tareas activas</span>
            {attentionCount > 0 && (
              <> y <span className="font-semibold text-red-600 dark:text-red-400">{attentionCount} requieren atención inmediata</span></>
            )}.
          </p>
        </div>
        <Link
          to="/tasks/create"
          className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-blue-500/25 transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]"
        >
          <HiOutlinePlus className="h-4 w-4" />
          Nueva tarea
        </Link>
      </FadeIn>

      {/* Lo importante hoy + Resumen rápido */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Lo importante hoy - 3 cols */}
        <FadeIn delay={0.05} className="lg:col-span-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 px-6 py-4">
            <span className="text-xl">🔥</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Lo importante hoy</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Empieza por estas tareas para evitar atrasos.</p>
            </div>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800 px-6">
            {urgentTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <HiOutlineCheckCircle className="mb-2 h-10 w-10 text-green-400" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">¡Todo al día!</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">No tienes tareas urgentes pendientes.</p>
              </div>
            ) : (
              urgentTasks.slice(0, 4).map((t) => (
                <UrgentTaskRow key={t.id} task={t} />
              ))
            )}
          </div>
        </FadeIn>

        {/* Resumen rápido - 2 cols */}
        <FadeIn delay={0.1} className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Resumen rápido</h3>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Activas" value={data.active_tasks ?? 0} icon={<HiOutlineClipboardList className="h-4.5 w-4.5" />} color="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30" />
              <MiniStat label="Vencidas" value={data.overdue_tasks ?? 0} icon={<HiOutlineExclamation className="h-4.5 w-4.5" />} color="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30" alert={data.overdue_tasks > 0} />
              <MiniStat label="En revisión" value={inReviewCount} icon={<HiOutlineClock className="h-4.5 w-4.5" />} color="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30" />
              <MiniStat label="Completadas" value={data.completed_tasks ?? 0} icon={<HiOutlineCheckCircle className="h-4.5 w-4.5" />} color="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30" />
            </div>
            {data.due_soon_tasks > 0 && (
              <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-900/30 px-4 py-3 ring-1 ring-inset ring-amber-200 dark:ring-amber-800/60">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Sugerencia del día</p>
                <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                  Tienes {data.due_soon_tasks} tarea{data.due_soon_tasks !== 1 ? 's' : ''} próxima{data.due_soon_tasks !== 1 ? 's' : ''} a vencer. Revisa su avance para evitar atrasos.
                </p>
              </div>
            )}
          </div>
        </FadeIn>
      </div>

      {/* Mis tareas + Sidebar derecho */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Mis tareas - 3 cols */}
        <FadeIn delay={0.15} className="lg:col-span-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 px-6 py-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Mis tareas activas</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">En progreso, en revisión, vencidas o rechazadas.</p>
            </div>
            <Link to="/tasks" className="rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100">
              Ver todas
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {myTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                <HiOutlineCheckCircle className="mb-2 h-10 w-10 text-green-400" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">¡Sin tareas activas!</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">No tienes tareas en curso en este momento.</p>
              </div>
            ) : (
              myTasks.slice(0, 5).map((t) => (
                <TaskRow key={t.id} task={t} />
              ))
            )}
          </div>
        </FadeIn>

        {/* Sidebar derecho - 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Próximas actividades */}
          <FadeIn delay={0.2} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
              <HiOutlineCalendar className="h-4.5 w-4.5 text-indigo-500 dark:text-indigo-400" />
              Por iniciar
            </h3>
            {pendingTasks.length === 0 ? (
              <p className="py-3 text-center text-xs text-gray-400 dark:text-gray-500">Sin tareas pendientes de inicio</p>
            ) : (
              <div className="space-y-2">
                {pendingTasks.slice(0, 4).map((t) => (
                  <Link key={t.id} to={`/tasks/${t.id}`} className="group flex items-center justify-between rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-800 p-3 transition-all hover:border-indigo-100 dark:hover:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">{t.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {t.due_date ? `Vence ${formatRelativeDate(t.due_date)}` : 'Sin fecha límite'}
                      </p>
                    </div>
                    <HiOutlineChevronRight className="ml-2 h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" />
                  </Link>
                ))}
              </div>
            )}
          </FadeIn>

          {/* Ayuda rápida */}
          <FadeIn delay={0.25} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
              <HiOutlineQuestionMarkCircle className="h-4.5 w-4.5 text-blue-500 dark:text-blue-400" />
              Ayuda rápida
            </h3>
            <div className="space-y-2">
              {TIPS.slice(0, 3).map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-gray-700 dark:text-gray-300">
                  <span className="mt-0.5 text-sm shrink-0">{tip.icon}</span>
                  <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">{tip.text}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

/* ---- Sub-components ---- */

function MiniStat({ label, value, icon, color, alert }: { label: string; value: number; icon: React.ReactNode; color: string; alert?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-3 transition-colors ${alert ? 'border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-900/20' : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${color}`}>{icon}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <p className={`mt-1.5 text-xl font-bold ${alert ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
    </div>
  );
}

function UrgentTaskRow({ task }: { task: UpcomingTask }) {
  const isOverdue = task.is_overdue ?? task.status === TaskStatus.OVERDUE;
  return (
    <div className="flex items-center justify-between gap-3 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{task.title}</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {isOverdue ? (
            <span className="font-medium text-red-600 dark:text-red-400">Vencida · {formatRelativeDate(task.due_date)}</span>
          ) : (
            <>Vence {task.due_date ? formatRelativeDate(task.due_date) : 'sin fecha'}</>
          )}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant={PRIORITY_BADGE_VARIANT[task.priority]} size="sm">{TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS]}</Badge>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link to={`/tasks/${task.id}`} className="rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
          <HiOutlineEye className="inline h-3.5 w-3.5" /> Ver
        </Link>
        <Link to={`/tasks/${task.id}`} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700">
          <HiOutlineLightningBolt className="inline h-3.5 w-3.5" /> Resolver
        </Link>
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: UpcomingTask }) {
  return (
    <div className="flex items-center justify-between gap-3 px-6 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{task.title}</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {task.due_date ? formatRelativeDate(task.due_date) : 'Sin fecha límite'}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant={PRIORITY_BADGE_VARIANT[task.priority]} size="sm">{TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS]}</Badge>
          {task.status === TaskStatus.OVERDUE && <Badge variant="red" size="sm">Vencida</Badge>}
        </div>
      </div>
      <Link
        to={`/tasks/${task.id}`}
        className="shrink-0 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
      >
        Actualizar
      </Link>
    </div>
  );
}
