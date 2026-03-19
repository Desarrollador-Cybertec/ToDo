import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboard';
import { meetingsApi } from '../../api/meetings';
import { useAuth } from '../../context/useAuth';
import { TaskStatus, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../types/enums';
import type { PersonalDashboard, AreaDashboard, Meeting, UpcomingTask } from '../../types';
import {
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineChevronRight,
  HiOutlineEye,
  HiOutlineLightningBolt,
  HiOutlineCalendar,
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
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const areaId = user?.area_id;
    Promise.all([
      dashboardApi.personal(),
      areaId ? dashboardApi.area(areaId).catch(() => null) : Promise.resolve(null),
      meetingsApi.list().catch(() => [] as Meeting[]),
    ]).then(([dashboard, areaDashboard, meetingList]) => {
      setData(dashboard);
      setAreaData(areaDashboard);
      setMeetings(Array.isArray(meetingList) ? meetingList : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user?.area_id]);

  const urgentTasks = useMemo(() => {
    if (!data?.upcoming_tasks) return [];
    return data.upcoming_tasks.filter(
      (t) => t.status === TaskStatus.OVERDUE || t.priority === 'urgent' || t.priority === 'high'
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

  const upcomingMeetings = useMemo(() => {
    const now = new Date();
    return meetings
      .filter((m) => new Date(m.meeting_date) >= now)
      .sort((a, b) => new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime())
      .slice(0, 3);
  }, [meetings]);

  const inReviewCount = useMemo(() => data?.tasks_by_status?.[TaskStatus.IN_REVIEW] ?? 0, [data]);

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
            Tu equipo tiene <span className="font-semibold text-gray-900">{data.active_tasks ?? 0} tareas activas</span>
            {attentionCount > 0 && (
              <> y <span className="font-semibold text-red-600">{attentionCount} requieren atención</span></>
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

      {/* Requiere atención + Resumen rápido */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Requiere atención - 3 cols */}
        <FadeIn delay={0.05} className="lg:col-span-3 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
            <span className="text-xl">🔥</span>
            <div>
              <h3 className="font-semibold text-gray-900">Requiere atención</h3>
              <p className="text-xs text-gray-500">Tareas urgentes, vencidas o de alta prioridad.</p>
            </div>
          </div>
          <div className="divide-y divide-gray-50 px-6">
            {urgentTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <HiOutlineCheckCircle className="mb-2 h-10 w-10 text-green-400" />
                <p className="text-sm font-medium text-gray-600">¡Todo bajo control!</p>
                <p className="text-xs text-gray-400">No hay tareas urgentes pendientes.</p>
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
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Resumen del área</h3>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Activas" value={data.active_tasks ?? 0} icon={<HiOutlineClipboardList className="h-4.5 w-4.5" />} color="text-blue-600 bg-blue-50" />
              <MiniStat label="Vencidas" value={data.overdue_tasks ?? 0} icon={<HiOutlineExclamation className="h-4.5 w-4.5" />} color="text-red-600 bg-red-50" alert={data.overdue_tasks > 0} />
              <MiniStat label="En revisión" value={inReviewCount} icon={<HiOutlineClock className="h-4.5 w-4.5" />} color="text-purple-600 bg-purple-50" />
              <MiniStat label="Completadas" value={data.completed_tasks ?? 0} icon={<HiOutlineCheckCircle className="h-4.5 w-4.5" />} color="text-green-600 bg-green-50" />
            </div>
            {data.due_soon_tasks > 0 && (
              <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-inset ring-amber-200/60">
                <p className="text-xs font-semibold text-amber-700">Atención</p>
                <p className="mt-0.5 text-xs text-amber-600">
                  Hay {data.due_soon_tasks} tarea{data.due_soon_tasks !== 1 ? 's' : ''} próxima{data.due_soon_tasks !== 1 ? 's' : ''} a vencer. Coordina con tu equipo para evitar atrasos.
                </p>
              </div>
            )}
          </div>
        </FadeIn>
      </div>

      {/* Tareas del equipo + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Tareas - 3 cols */}
        <FadeIn delay={0.15} className="lg:col-span-3 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h3 className="font-semibold text-gray-900">Tareas del equipo</h3>
              <p className="text-xs text-gray-400">Ordenadas por prioridad y fecha.</p>
            </div>
            <Link to="/tasks" className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">
              Ver todas
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {allTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                <HiOutlineClipboardList className="mb-2 h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-500">No hay tareas asignadas</p>
              </div>
            ) : (
              allTasks.slice(0, 6).map((t) => (
                <TaskRow key={t.id} task={t} />
              ))
            )}
          </div>
        </FadeIn>

        {/* Sidebar derecho - 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tareas por estado */}
          <FadeIn delay={0.2} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="font-semibold text-gray-900">Por estado</h3>
            </div>
            <div className="divide-y divide-gray-50 px-5">
              {(() => {
                const byStatus = areaData?.tasks_by_status ?? data.tasks_by_status ?? {};
                const entries = Object.entries(byStatus).filter(([, c]) => c > 0);
                if (entries.length === 0) {
                  return <p className="py-6 text-center text-sm text-gray-400">Sin datos de estado disponibles</p>;
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
              Consejos
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

function UrgentTaskRow({ task }: { task: UpcomingTask }) {
  const isOverdue = task.status === TaskStatus.OVERDUE;
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
