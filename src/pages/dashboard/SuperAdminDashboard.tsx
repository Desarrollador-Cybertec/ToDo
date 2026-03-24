import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboard';
import { useAuth } from '../../context/useAuth';
import {  TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../types/enums';
import type { GeneralDashboard, MyTask, PendingByUser } from '../../types';
import {
  HiOutlineClipboardList,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineTrendingUp,
  HiOutlineChevronRight,
  HiOutlineLightBulb,
  HiOutlineUserGroup,
  HiOutlineOfficeBuilding,
  HiOutlinePlusCircle,
  HiOutlineClock,
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
  { icon: '📊', text: 'Revisa el consolidado para un panorama completo de todas las áreas.' },
  { icon: '⚠️', text: 'Las tareas vencidas impactan la tasa de cumplimiento global.' },
  { icon: '👥', text: 'Monitorea la carga de trabajo para balancear asignaciones.' },
  { icon: '📅', text: 'Las reuniones generan tareas automáticamente cuando se registran acuerdos.' },
];

export function SuperAdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<GeneralDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    dashboardApi.general()
      .then((dashboard) => setData(dashboard))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const topOverloaded = useMemo(() => {
    if (!data?.pending_by_user) return [];
    return [...data.pending_by_user].sort((a, b) => b.pending_tasks - a.pending_tasks).slice(0, 5);
  }, [data]);

  if (loading) return <SkeletonDashboard />;
  if (error || !data) return <p className="text-gray-500 dark:text-gray-400">No se pudo cargar el dashboard general.</p>;

  const firstName = user?.name?.split(' ')[0] ?? '';
  const healthColor = data.completion_rate >= 75 ? 'text-green-600 dark:text-green-400' : data.completion_rate >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <FadeIn className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-5 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Hola, {firstName} <span className="inline-block origin-[70%_70%] animate-[wave_1.8s_ease-in-out_infinite]">👋</span>
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Hay <span className="font-semibold text-gray-900 dark:text-gray-100">{data.total_active} tareas activas</span> en la organización
            {data.overdue_tasks > 0 && (
              <> y <span className="font-semibold text-red-600 dark:text-red-400">{data.overdue_tasks} vencida{data.overdue_tasks !== 1 ? 's' : ''}</span></>
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
            to="/consolidated"
            className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <HiOutlineTrendingUp className="h-4 w-4" />
            Consolidado
          </Link>
        </div>
      </FadeIn>

      {/* Resumen rápido + Tareas por estado */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Resumen rápido - 3 cols */}
        <FadeIn delay={0.05} className="lg:col-span-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Resumen general</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Activas" value={data.total_active} icon={<HiOutlineClipboardList className="h-4.5 w-4.5" />} color="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30" />
            <MiniStat label="Vencidas" value={data.overdue_tasks} icon={<HiOutlineExclamation className="h-4.5 w-4.5" />} color="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30" alert={data.overdue_tasks > 0} />
            <MiniStat label="Completadas" value={data.total_completed} icon={<HiOutlineCheckCircle className="h-4.5 w-4.5" />} color="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30" />
            <MiniStat label="Por vencer" value={data.due_soon} icon={<HiOutlineClock className="h-4.5 w-4.5" />} color="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30" alert={data.due_soon > 0} />
          </div>

          {/* progress bar for completion rate */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Tasa de cumplimiento</span>
              <span className={`font-bold ${healthColor}`}>{data.completion_rate}%</span>
            </div>
            <div className="mt-2 h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-700">
              <div
                className={`h-2.5 rounded-full transition-all ${data.completion_rate >= 75 ? 'bg-green-500' : data.completion_rate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(data.completion_rate, 100)}%` }}
              />
            </div>
          </div>

          {/* extra metrics row */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-center text-gray-700 dark:text-gray-300">
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{data.total_all}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total históricas</p>
            </div>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/30 px-3 py-2.5 text-center">
              <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{data.global_progress}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Progreso global</p>
            </div>
            <div className="rounded-xl bg-green-50 dark:bg-green-900/30 px-3 py-2.5 text-center">
              <p className="text-lg font-bold text-green-700 dark:text-green-400">{data.completed_this_month}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Completadas (mes)</p>
            </div>
            {data.total_cancelled != null && (
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-center text-gray-700 dark:text-gray-300">
                <p className="text-lg font-bold text-gray-500 dark:text-gray-400">{data.total_cancelled}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Canceladas</p>
              </div>
            )}
          </div>
        </FadeIn>

        {/* Tareas por estado - 2 cols */}
        <FadeIn delay={0.1} className="lg:col-span-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Tareas por estado</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">Distribución actual de todas las tareas.</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800 px-6">
            {(() => {
              const entries = Object.entries(data.tasks_by_status ?? {}).filter(([, c]) => c > 0);
              if (entries.length === 0) {
                return <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">Sin datos de estado disponibles</p>;
              }
              const total = data.total_all || 1;
              return entries.map(([status, count]) => {
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={status} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <Badge variant={STATUS_BADGE_VARIANT[status] ?? 'gray'}>{TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS] ?? status}</Badge>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{count}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700">
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

      {/* Carga por usuario + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Pendientes por usuario - 3 cols */}
        <FadeIn delay={0.15} className="lg:col-span-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
            <div className="flex items-center gap-2">
              <HiOutlineUserGroup className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Carga por usuario</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">Usuarios con más tareas pendientes.</p>
              </div>
            </div>
            <Link to="/users" className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100">
              Ver usuarios
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800 px-6">
            {topOverloaded.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <HiOutlineCheckCircle className="mb-2 h-10 w-10 text-green-400" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sin tareas pendientes</p>
              </div>
            ) : (
              topOverloaded.map((r: PendingByUser) => {
                const maxPending = topOverloaded[0]?.pending_tasks || 1;
                const pct = Math.round((r.pending_tasks / maxPending) * 100);
                return (
                  <div key={r.user_id} className="flex items-center gap-3 py-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-500 text-sm font-medium text-white">
                      {r.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{r.user_name}</p>
                        <span className={`text-sm font-bold ${r.pending_tasks > 5 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>{r.pending_tasks}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                        <div className={`h-1.5 rounded-full transition-all ${r.pending_tasks > 5 ? 'bg-red-400' : 'bg-blue-400'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </FadeIn>

        {/* Sidebar derecho - 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tareas por área */}
          <FadeIn delay={0.2} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 px-5 py-4">
              <HiOutlineOfficeBuilding className="h-4.5 w-4.5 text-blue-500 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Por área</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800 px-5">
              {(data.tasks_by_area ?? []).length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">Sin áreas registradas</p>
              ) : (
                (data.tasks_by_area ?? []).map((a) => (
                  <Link key={a.area_id} to={`/areas/${a.area_id}`} className="group flex items-center justify-between py-3 transition-colors hover:text-blue-700">
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">{a.area_name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                        {a.total}
                      </span>
                      <HiOutlineChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </FadeIn>

          {/* Mis tareas */}
          <FadeIn delay={0.25} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-5 py-4">
              <div className="flex items-center gap-2">
                <HiOutlineClipboardList className="h-4.5 w-4.5 text-blue-500 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Mis tareas</h3>
              </div>
              <Link to="/tasks" className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100">
                Ver todas
              </Link>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {!data.my_tasks || data.my_tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <HiOutlineCheckCircle className="mb-2 h-8 w-8 text-green-400" />
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Sin tareas asignadas</p>
                </div>
              ) : (
                data.my_tasks.map((t) => (
                  <MyTaskRow key={t.id} task={t} />
                ))
              )}
            </div>
          </FadeIn>

          {/* Tips */}
          <FadeIn delay={0.3} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
              <HiOutlineLightBulb className="h-4.5 w-4.5 text-amber-500 dark:text-amber-400" />
              Consejos de gestión
            </h3>
            <div className="space-y-2">
              {TIPS.slice(0, 3).map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-gray-700 dark:text-gray-300">
                  <span className="mt-0.5 shrink-0 text-sm">{tip.icon}</span>
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

/* ── Sub-components ── */

function MyTaskRow({ task }: { task: MyTask }) {
  return (
    <div className="flex items-center justify-between gap-3 px-6 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{task.title}</p>
          {task.is_overdue && <Badge variant="red" size="sm">Vencida</Badge>}
          {task.area_id == null && <Badge variant="gray" size="sm">Personal</Badge>}
        </div>
        <div className="mt-1.5 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              className={`h-1.5 rounded-full transition-all ${
                task.progress_percent >= 100 ? 'bg-green-500' : task.is_overdue ? 'bg-red-400' : 'bg-blue-400'
              }`}
              style={{ width: `${Math.min(task.progress_percent, 100)}%` }}
            />
          </div>
          <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{task.progress_percent}%</span>
        </div>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          {task.due_date ? formatRelativeDate(task.due_date) : 'Sin fecha'}
        </p>
      </div>
      <div className="ml-3 flex shrink-0 items-center gap-2">
        <Badge variant={PRIORITY_BADGE_VARIANT[task.priority] ?? 'gray'} size="sm">
          {TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS] ?? task.priority}
        </Badge>
        <Link to={`/tasks/${task.id}`} className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
          Ver
        </Link>
      </div>
    </div>
  );
}

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
