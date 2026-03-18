import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboard';
import { meetingsApi } from '../../api/meetings';
import { useAuth } from '../../context/useAuth';
import { TaskStatus, TASK_STATUS_LABELS } from '../../types/enums';
import type { GeneralDashboard, PendingByUser, Meeting } from '../../types';
import {
  HiOutlineClipboardList,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineTrendingUp,
  HiOutlineChevronRight,
  HiOutlineCalendar,
  HiOutlineLightBulb,
  HiOutlineUserGroup,
  HiOutlineOfficeBuilding,
  HiOutlinePlusCircle,
  HiOutlineClock,
} from 'react-icons/hi';
import { FadeIn, SkeletonDashboard, Badge, STATUS_BADGE_VARIANT } from '../../components/ui';

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
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      dashboardApi.general(),
      meetingsApi.list().catch(() => [] as Meeting[]),
    ]).then(([dashboard, meetingList]) => {
      setData(dashboard);
      setMeetings(Array.isArray(meetingList) ? meetingList : []);
    }).catch(() => {
      setError(true);
    }).finally(() => setLoading(false));
  }, []);

  const upcomingMeetings = useMemo(() => {
    const now = new Date();
    return meetings
      .filter((m) => new Date(m.meeting_date) >= now)
      .sort((a, b) => new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime())
      .slice(0, 3);
  }, [meetings]);

  const topOverloaded = useMemo(() => {
    if (!data?.pending_by_user) return [];
    return [...data.pending_by_user].sort((a, b) => b.pending_tasks - a.pending_tasks).slice(0, 5);
  }, [data]);

  if (loading) return <SkeletonDashboard />;
  if (error || !data) return <p className="text-gray-500">No se pudo cargar el dashboard general.</p>;

  const firstName = user?.name?.split(' ')[0] ?? '';
  const healthColor = data.completion_rate >= 75 ? 'text-green-600' : data.completion_rate >= 50 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <FadeIn className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Hola, {firstName} <span className="inline-block origin-[70%_70%] animate-[wave_1.8s_ease-in-out_infinite]">👋</span>
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Hay <span className="font-semibold text-gray-900">{data.total_active} tareas activas</span> en la organización
            {data.overdue_tasks > 0 && (
              <> y <span className="font-semibold text-red-600">{data.overdue_tasks} vencida{data.overdue_tasks !== 1 ? 's' : ''}</span></>
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
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <HiOutlineTrendingUp className="h-4 w-4" />
            Consolidado
          </Link>
        </div>
      </FadeIn>

      {/* Resumen rápido + Tareas por estado */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Resumen rápido - 3 cols */}
        <FadeIn delay={0.05} className="lg:col-span-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">Resumen general</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Activas" value={data.total_active} icon={<HiOutlineClipboardList className="h-4.5 w-4.5" />} color="text-blue-600 bg-blue-50" />
            <MiniStat label="Vencidas" value={data.overdue_tasks} icon={<HiOutlineExclamation className="h-4.5 w-4.5" />} color="text-red-600 bg-red-50" alert={data.overdue_tasks > 0} />
            <MiniStat label="Completadas" value={data.total_completed} icon={<HiOutlineCheckCircle className="h-4.5 w-4.5" />} color="text-green-600 bg-green-50" />
            <MiniStat label="Por vencer" value={data.due_soon} icon={<HiOutlineClock className="h-4.5 w-4.5" />} color="text-amber-600 bg-amber-50" alert={data.due_soon > 0} />
          </div>

          {/* progress bar for completion rate */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Tasa de cumplimiento</span>
              <span className={`font-bold ${healthColor}`}>{data.completion_rate}%</span>
            </div>
            <div className="mt-2 h-2.5 w-full rounded-full bg-gray-100">
              <div
                className={`h-2.5 rounded-full transition-all ${data.completion_rate >= 75 ? 'bg-green-500' : data.completion_rate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(data.completion_rate, 100)}%` }}
              />
            </div>
          </div>

          {/* extra metrics row */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-center">
              <p className="text-lg font-bold text-gray-900">{data.total_all}</p>
              <p className="text-xs text-gray-500">Total históricas</p>
            </div>
            <div className="rounded-xl bg-blue-50 px-3 py-2.5 text-center">
              <p className="text-lg font-bold text-blue-700">{data.global_progress}%</p>
              <p className="text-xs text-gray-500">Progreso global</p>
            </div>
            <div className="rounded-xl bg-green-50 px-3 py-2.5 text-center">
              <p className="text-lg font-bold text-green-700">{data.completed_this_month}</p>
              <p className="text-xs text-gray-500">Completadas (mes)</p>
            </div>
          </div>
        </FadeIn>

        {/* Tareas por estado - 2 cols */}
        <FadeIn delay={0.1} className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="font-semibold text-gray-900">Tareas por estado</h3>
            <p className="text-xs text-gray-400">Distribución actual de todas las tareas.</p>
          </div>
          <div className="divide-y divide-gray-50 px-6">
            {Object.entries(data.tasks_by_status ?? {}).map(([status, count]) => {
              const total = data.total_all || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <Badge variant={STATUS_BADGE_VARIANT[status]}>{TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS] ?? status}</Badge>
                      <span className="text-sm font-semibold text-gray-900">{count}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
                      <div
                        className={`h-1.5 rounded-full transition-all ${status === TaskStatus.COMPLETED ? 'bg-green-500' : status === TaskStatus.OVERDUE ? 'bg-red-500' : 'bg-blue-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </FadeIn>
      </div>

      {/* Carga por usuario + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Pendientes por usuario - 3 cols */}
        <FadeIn delay={0.15} className="lg:col-span-3 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <HiOutlineUserGroup className="h-5 w-5 text-indigo-500" />
              <div>
                <h3 className="font-semibold text-gray-900">Carga por usuario</h3>
                <p className="text-xs text-gray-400">Usuarios con más tareas pendientes.</p>
              </div>
            </div>
            <Link to="/users" className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">
              Ver usuarios
            </Link>
          </div>
          <div className="divide-y divide-gray-50 px-6">
            {topOverloaded.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <HiOutlineCheckCircle className="mb-2 h-10 w-10 text-green-400" />
                <p className="text-sm font-medium text-gray-600">Sin tareas pendientes</p>
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
                        <p className="truncate text-sm font-medium text-gray-900">{r.user_name}</p>
                        <span className={`text-sm font-bold ${r.pending_tasks > 5 ? 'text-red-600' : 'text-gray-900'}`}>{r.pending_tasks}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
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
          <FadeIn delay={0.2} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <HiOutlineOfficeBuilding className="h-4.5 w-4.5 text-blue-500" />
              <h3 className="font-semibold text-gray-900">Por área</h3>
            </div>
            <div className="divide-y divide-gray-50 px-5">
              {(data.tasks_by_area ?? []).length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400">Sin áreas registradas</p>
              ) : (
                (data.tasks_by_area ?? []).map((a) => (
                  <Link key={a.area_id} to={`/areas/${a.area_id}`} className="group flex items-center justify-between py-3 transition-colors hover:text-blue-700">
                    <span className="text-sm text-gray-700 group-hover:text-blue-700">{a.area_name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 group-hover:bg-blue-50 group-hover:text-blue-700">
                        {a.total}
                      </span>
                      <HiOutlineChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-500" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </FadeIn>

          {/* Próximas reuniones */}
          <FadeIn delay={0.25} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
              <HiOutlineCalendar className="h-4.5 w-4.5 text-indigo-500" />
              Próximas reuniones
            </h3>
            {upcomingMeetings.length === 0 ? (
              <p className="py-3 text-center text-xs text-gray-400">Sin reuniones próximas</p>
            ) : (
              <div className="space-y-2">
                {upcomingMeetings.map((m) => (
                  <Link key={m.id} to={`/meetings/${m.id}`} className="group block rounded-xl border border-gray-100 p-3 transition-all hover:border-indigo-100 hover:bg-indigo-50/30">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-700">{m.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {formatRelativeDate(m.meeting_date)} · {new Date(m.meeting_date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </FadeIn>

          {/* Tips */}
          <FadeIn delay={0.3} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
              <HiOutlineLightBulb className="h-4.5 w-4.5 text-amber-500" />
              Consejos de gestión
            </h3>
            <div className="space-y-2">
              {TIPS.slice(0, 3).map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-xl bg-gray-50 px-3.5 py-2.5">
                  <span className="mt-0.5 shrink-0 text-sm">{tip.icon}</span>
                  <p className="text-xs leading-relaxed text-gray-600">{tip.text}</p>
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
